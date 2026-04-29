(() => {
  const startTagCanvas = (canvasId) => {
    if (typeof window.TagCanvas === "undefined") return;

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    try {
      window.TagCanvas.Start(canvasId, "", {
        outlineThickness: 1,
        maxSpeed: 0.03,
        outlineColour: "#aaa",
        weight: true,
        padding: 4,
        fadIn: 200,
        wheelZoom: false,
        initial: [0.1, -0.03]
      });
    } catch (err) {
      const container = canvas.parentElement;
      if (container) container.style.display = "none";
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    startTagCanvas("resCanvas");
    startTagCanvas("tagCanvas");
  });
})();
