import {
  useCallback,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type { Project, ProjectSettings, Slide } from "../models";
import { createProject, createSlide } from "../services/ProjectFactory";
import {
  ProjectStoreContext,
  type ProjectStoreValue,
  type SlideContentPatch,
} from "./ProjectStoreContext";

type ProjectStoreState = {
  project: Project;
  selectedSlideId: string | null;
  isDirty: boolean;
};

function normalizeSlides(slides: Slide[]): Slide[] {
  return slides.map((slide, index) => ({
    ...slide,
    number: index + 1,
  }));
}

function touchProject(project: Project): Project {
  return {
    ...project,
    metadata: {
      ...project.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function ProjectStoreProvider({ children }: PropsWithChildren) {
  const initialProject = useMemo(() => createProject(), []);

  const [state, setState] = useState<ProjectStoreState>({
    project: initialProject,
    selectedSlideId: initialProject.slides[0]?.id ?? null,
    isDirty: false,
  });

  const setProject = useCallback((project: Project) => {
    setState({
      project,
      selectedSlideId: project.slides[0]?.id ?? null,
      isDirty: false,
    });
  }, []);

  const createNewProject = useCallback((name?: string) => {
    const project = createProject(name);

    setState({
      project,
      selectedSlideId: project.slides[0]?.id ?? null,
      isDirty: false,
    });
  }, []);

  const renameProject = useCallback((name: string) => {
    setState((current) => ({
      ...current,
      project: touchProject({ ...current.project, name }),
      isDirty: true,
    }));
  }, []);

  const setProjectScript = useCallback((script: string) => {
    setState((current) => ({
      ...current,
      project: touchProject({ ...current.project, script }),
      isDirty: true,
    }));
  }, []);

  const setScriptAndSlides = useCallback((script: string, slides: Slide[]) => {
    const normalized = normalizeSlides(slides);

    setState((current) => ({
      project: touchProject({
        ...current.project,
        script,
        slides: normalized,
      }),
      selectedSlideId:
        normalized.find((slide) => slide.id === current.selectedSlideId)?.id ??
        normalized[0]?.id ??
        null,
      isDirty: true,
    }));
  }, []);

  const updateProjectSettings = useCallback(
    (patch: Partial<ProjectSettings>) => {
      setState((current) => ({
        ...current,
        project: touchProject({
          ...current.project,
          settings: {
            ...current.project.settings,
            ...patch,
          },
        }),
        isDirty: true,
      }));
    },
    [],
  );

  const selectSlide = useCallback((slideId: string | null) => {
    setState((current) => ({ ...current, selectedSlideId: slideId }));
  }, []);

  const addSlide = useCallback((afterSlideId?: string) => {
    const newSlide = createSlide(1);

    setState((current) => {
      const slides = [...current.project.slides];
      const sourceIndex = afterSlideId
        ? slides.findIndex((slide) => slide.id === afterSlideId)
        : slides.length - 1;
      const insertIndex = sourceIndex >= 0 ? sourceIndex + 1 : slides.length;

      slides.splice(insertIndex, 0, newSlide);

      return {
        project: touchProject({
          ...current.project,
          slides: normalizeSlides(slides),
        }),
        selectedSlideId: newSlide.id,
        isDirty: true,
      };
    });

    return newSlide.id;
  }, []);

  const duplicateSlide = useCallback((slideId: string): string | null => {
    let duplicateId: string | null = null;

    setState((current) => {
      const sourceIndex = current.project.slides.findIndex(
        (slide) => slide.id === slideId,
      );

      if (sourceIndex < 0) return current;

      const source = current.project.slides[sourceIndex];
      const fresh = createSlide(source.number + 1);
      duplicateId = fresh.id;

      const duplicate: Slide = {
        ...source,
        id: fresh.id,
        number: fresh.number,
        status: "draft",
        createdAt: fresh.createdAt,
        updatedAt: fresh.updatedAt,
        background: {
          ...source.background,
          generationId: null,
        },
      };

      const slides = [...current.project.slides];
      slides.splice(sourceIndex + 1, 0, duplicate);

      return {
        project: touchProject({
          ...current.project,
          slides: normalizeSlides(slides),
        }),
        selectedSlideId: duplicate.id,
        isDirty: true,
      };
    });

    return duplicateId;
  }, []);

  const updateSlide = useCallback(
    (slideId: string, patch: SlideContentPatch) => {
      setState((current) => ({
        ...current,
        project: touchProject({
          ...current.project,
          slides: current.project.slides.map((slide) =>
            slide.id === slideId
              ? {
                  ...slide,
                  ...patch,
                  updatedAt: new Date().toISOString(),
                }
              : slide,
          ),
        }),
        isDirty: true,
      }));
    },
    [],
  );

  const replaceSlides = useCallback((slides: Slide[]) => {
    const normalized = normalizeSlides(slides);

    setState((current) => ({
      project: touchProject({ ...current.project, slides: normalized }),
      selectedSlideId:
        normalized.find((slide) => slide.id === current.selectedSlideId)?.id ??
        normalized[0]?.id ??
        null,
      isDirty: true,
    }));
  }, []);

  const removeSlide = useCallback((slideId: string) => {
    setState((current) => {
      const remaining = normalizeSlides(
        current.project.slides.filter((slide) => slide.id !== slideId),
      );
      const nextSlides = remaining.length ? remaining : [createSlide(1)];

      return {
        project: touchProject({ ...current.project, slides: nextSlides }),
        selectedSlideId:
          current.selectedSlideId === slideId
            ? nextSlides[0]?.id ?? null
            : current.selectedSlideId,
        isDirty: true,
      };
    });
  }, []);

  const reorderSlides = useCallback((orderedSlideIds: string[]) => {
    setState((current) => {
      const slideMap = new Map(
        current.project.slides.map((slide) => [slide.id, slide]),
      );

      const ordered = orderedSlideIds
        .map((id) => slideMap.get(id))
        .filter((slide): slide is Slide => Boolean(slide));

      const omitted = current.project.slides.filter(
        (slide) => !orderedSlideIds.includes(slide.id),
      );

      return {
        ...current,
        project: touchProject({
          ...current.project,
          slides: normalizeSlides([...ordered, ...omitted]),
        }),
        isDirty: true,
      };
    });
  }, []);

  const markSaved = useCallback(() => {
    setState((current) => ({ ...current, isDirty: false }));
  }, []);

  const selectedSlide =
    state.project.slides.find(
      (slide) => slide.id === state.selectedSlideId,
    ) ?? null;

  const value = useMemo<ProjectStoreValue>(
    () => ({
      ...state,
      selectedSlide,
      setProject,
      createNewProject,
      renameProject,
      setProjectScript,
      setScriptAndSlides,
      updateProjectSettings,
      selectSlide,
      addSlide,
      duplicateSlide,
      updateSlide,
      replaceSlides,
      removeSlide,
      reorderSlides,
      markSaved,
    }),
    [
      state,
      selectedSlide,
      setProject,
      createNewProject,
      renameProject,
      setProjectScript,
      setScriptAndSlides,
      updateProjectSettings,
      selectSlide,
      addSlide,
      duplicateSlide,
      updateSlide,
      replaceSlides,
      removeSlide,
      reorderSlides,
      markSaved,
    ],
  );

  return (
    <ProjectStoreContext.Provider value={value}>
      {children}
    </ProjectStoreContext.Provider>
  );
}
