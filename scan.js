const fs = require("fs");
const path = require("path");

const imagesDir = path.join(__dirname, "images");
const naturalSort = (a, b) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
const isImage = (file) => /\.(jpe?g|png|webp|gif|avif)$/i.test(file);
const isChapThumb = (file) => /^(cover|thumb)\.(jpe?g|png|webp|gif|avif)$/i.test(file);

let chapters = [];
let autoCover = "";

if (fs.existsSync(imagesDir)) {
  const allEntries = fs.readdirSync(imagesDir);

  const folders = allEntries
    .filter((name) => {
      try {
        return fs.statSync(path.join(imagesDir, name)).isDirectory();
      } catch {
        return false;
      }
    })
    .sort(naturalSort);

  chapters = folders
    .map((folderName, idx) => {
      const folderPath = path.join(imagesDir, folderName);
      const allImages = fs
        .readdirSync(folderPath)
        .filter((f) => {
          try {
            return fs.statSync(path.join(folderPath, f)).isFile() && isImage(f);
          } catch {
            return false;
          }
        })
        .sort(naturalSort);

      const thumbFile = allImages.find(isChapThumb);
      const pageFiles = allImages.filter((f) => !isChapThumb(f));
      const finalPages = pageFiles.length > 0 ? pageFiles : allImages;
      const toUrl = (f) => `images/${encodeURIComponent(folderName)}/${encodeURIComponent(f)}`;

      return {
        id: idx + 1,
        name: folderName,
        thumb: thumbFile ? toUrl(thumbFile) : (finalPages[0] ? toUrl(finalPages[0]) : ""),
        urls: finalPages.map(toUrl)
      };
    })
    .filter((chap) => chap.urls.length > 0);

  const foundCover = allEntries.find((f) => /^cover\.(jpe?g|png|webp|gif|avif)$/i.test(f));
  if (foundCover) {
    autoCover = `images/${encodeURIComponent(foundCover)}`;
  } else if (chapters.length > 0) {
    autoCover = chapters[0].thumb;
  }
}

const output = `window.AUTO_DATA = ${JSON.stringify({ cover: autoCover, chapters }, null, 2)};\n`;
fs.writeFileSync(path.join(__dirname, "chapters.js"), output, "utf8");
console.log(`Xong! Da tu dong quet ${chapters.length} chap.`);
chapters.forEach((c) => console.log(` - ${c.name}: ${c.urls.length} trang`));