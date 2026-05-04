"use strict";

const fs = require("fs");
const path = require("path");

const IMAGE_EXTENSIONS = new Set([
  ".avif",
  ".bmp",
  ".gif",
  ".jpg",
  ".jpeg",
  ".png",
  ".svg",
  ".webp"
]);

const imageCollator = new Intl.Collator("zh-Hans-CN", {
  numeric: true,
  sensitivity: "base"
});

const listGalleryImages = (hexoInstance) => {
  const galleryDir = path.join(hexoInstance.source_dir, "img", "gallery");
  const galleryWebpDir = path.join(hexoInstance.source_dir, "img", "gallery-webp");
  if (!fs.existsSync(galleryDir)) return [];

  const candidates = new Map();

  const pickCandidate = (candidate) => {
    const previous = candidates.get(candidate.stem);
    if (!previous || candidate.priority > previous.priority) {
      candidates.set(candidate.stem, candidate);
    }
  };

  fs
    .readdirSync(galleryDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .forEach((name) => {
      const ext = path.extname(name).toLowerCase();
      const stem = path.basename(name, ext);
      const encodedName = encodeURIComponent(name);
      const webpName = `${stem}.webp`;
      const webpPath = path.join(galleryWebpDir, webpName);
      const hasConvertedWebp = fs.existsSync(webpPath);
      const isWebpSource = ext === ".webp";

      pickCandidate({
        name,
        stem,
        url: hasConvertedWebp
          ? `/img/gallery-webp/${encodeURIComponent(webpName)}`
          : `/img/gallery/${encodedName}`,
        fallbackUrl: `/img/gallery/${encodedName}`,
        priority: hasConvertedWebp ? 2 : isWebpSource ? 1 : 0
      });
    });

  return Array.from(candidates.values()).sort((left, right) => imageCollator.compare(left.name, right.name));
};

const registerHelper = (hexoInstance) => {
  if (!hexoInstance || !hexoInstance.extend) return;

  hexoInstance.extend.helper.register("getGalleryImages", function () {
    return listGalleryImages(hexoInstance);
  });
};

if (typeof hexo !== "undefined") {
  registerHelper(hexo);
}

module.exports = registerHelper;
