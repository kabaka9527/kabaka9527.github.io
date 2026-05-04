"use strict";

const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const sharp = require("sharp");

const SOURCE_DIR = path.join("img", "gallery");
const OUTPUT_DIR = path.join("img", "gallery-webp");

const CONVERTIBLE_EXTENSIONS = new Set([
  ".bmp",
  ".jpg",
  ".jpeg",
  ".png",
  ".tif",
  ".tiff"
]);

const getGalleryDir = (hexoInstance, relativeDir) => path.join(hexoInstance.source_dir, relativeDir);

const toWebpName = (fileName) => `${path.basename(fileName, path.extname(fileName))}.webp`;

async function generateGalleryWebp(hexoInstance) {
  const sourceDir = getGalleryDir(hexoInstance, SOURCE_DIR);
  const outputDir = getGalleryDir(hexoInstance, OUTPUT_DIR);

  if (!fs.existsSync(sourceDir)) return;

  await fsp.mkdir(outputDir, { recursive: true });

  const entries = await fsp.readdir(sourceDir, { withFileTypes: true });
  const desiredOutputs = new Set();

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const ext = path.extname(entry.name).toLowerCase();
    if (!CONVERTIBLE_EXTENSIONS.has(ext)) continue;

    const sourcePath = path.join(sourceDir, entry.name);
    const outputName = toWebpName(entry.name);
    const outputPath = path.join(outputDir, outputName);
    desiredOutputs.add(outputName);

    const sourceStat = await fsp.stat(sourcePath);
    let outputStat = null;

    try {
      outputStat = await fsp.stat(outputPath);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }

    if (outputStat && outputStat.mtimeMs >= sourceStat.mtimeMs) {
      continue;
    }

    await sharp(sourcePath, { failOnError: false })
      .webp({
        quality: 92,
        effort: 4
      })
      .toFile(outputPath);
  }

  const outputEntries = await fsp.readdir(outputDir, { withFileTypes: true });
  for (const entry of outputEntries) {
    if (!entry.isFile()) continue;
    if (path.extname(entry.name).toLowerCase() !== ".webp") continue;
    if (desiredOutputs.has(entry.name)) continue;
    await fsp.unlink(path.join(outputDir, entry.name));
  }
}

const registerFilter = (hexoInstance) => {
  if (!hexoInstance || !hexoInstance.extend) return;

  hexoInstance.extend.filter.register("before_generate", async function () {
    await generateGalleryWebp(hexoInstance);
  });
};

if (typeof hexo !== "undefined") {
  registerFilter(hexo);
}

module.exports = registerFilter;
