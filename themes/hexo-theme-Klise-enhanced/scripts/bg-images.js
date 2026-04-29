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

const listImages = (hexoInstance, subdir) => {
  const dir = path.join(hexoInstance.source_dir, subdir);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "en"))
    .map((name) => `/${subdir.replace(/\\/g, "/")}/${name}`);
};

const registerHelper = (hexoInstance) => {
  if (!hexoInstance || !hexoInstance.extend) return;

  hexoInstance.extend.helper.register("getBackgroundImages", function () {
    const light = listImages(hexoInstance, "img/day");
    const dark = listImages(hexoInstance, "img/night");
    return JSON.stringify({ light, dark });
  });
};

if (typeof hexo !== "undefined") {
  registerHelper(hexo);
}

module.exports = registerHelper;
