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
  if (!fs.existsSync(galleryDir)) return [];

  return fs
    .readdirSync(galleryDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort((left, right) => imageCollator.compare(left, right))
    .map((name) => ({
      name,
      stem: path.basename(name, path.extname(name))
    }));
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
