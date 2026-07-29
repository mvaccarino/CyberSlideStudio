function sanitizeFileName(value) {
  return String(value || "CyberSlide-Video")
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/[\r\n\t]/g, "")
    .trim()
    .replace(/[. ]+$/g, "") || "CyberSlide-Video";
}

function validatePlan(plan) {
  if (!plan || typeof plan !== "object") {
    throw new Error("A native video plan is required.");
  }

  if (!Array.isArray(plan.scenes) || plan.scenes.length === 0) {
    throw new Error("The video plan does not contain any scenes.");
  }

  return {
    projectName: sanitizeFileName(plan.projectName),
    width: 1080,
    height: 1920,
    fps: 30,
    scenes: plan.scenes.map((scene, index) => {
      if (!scene.imagePath) {
        throw new Error(`Scene ${index + 1} is missing its image path.`);
      }

      return {
        slideNumber: Number(scene.slideNumber) || index + 1,
        imagePath: String(scene.imagePath),
        durationSeconds: Math.max(
          1.5,
          Math.min(30, Number(scene.durationSeconds) || 4),
        ),
        motion: String(scene.motion || "slow-zoom-in"),
        transition: String(scene.transition || "fade"),
        transitionSeconds: Math.max(
          0.1,
          Math.min(1, Number(scene.transitionSeconds) || 0.3),
        ),
      };
    }),
    voiceoverPath: plan.voiceoverPath
      ? String(plan.voiceoverPath)
      : undefined,
    outputFileName: sanitizeFileName(
      plan.outputFileName ||
        `${sanitizeFileName(plan.projectName)}-Final-Video.mp4`,
    ),
  };
}

function totalDuration(plan) {
  return plan.scenes.reduce((total, scene, index) => {
    const overlap = index === 0 ? 0 : scene.transitionSeconds;
    return total + scene.durationSeconds - overlap;
  }, 0);
}

module.exports = {
  sanitizeFileName,
  totalDuration,
  validatePlan,
};
