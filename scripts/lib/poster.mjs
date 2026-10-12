// @ts-check
/**
 * Saving a poster the way the site needs it: a JPEG under
 * public/assets/events with its pixel size known, and a 600px copy beside
 * it for the cards. Shared by the Instagram sync and the issue intake.
 */
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** Width and height from a JPEG's start-of-frame marker. */
export const jpegSize = (/** @type {Buffer} */ buffer) => {
  let i = 2;
  while (i + 9 < buffer.length) {
    if (buffer[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = buffer[i + 1];
    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      ![0xc4, 0xc8, 0xcc].includes(marker)
    ) {
      return {
        posterHeight: buffer.readUInt16BE(i + 5),
        posterWidth: buffer.readUInt16BE(i + 7),
      };
    }
    if (
      marker === 0xd8 ||
      (marker >= 0xd0 && marker <= 0xd7) ||
      marker === 0x01
    ) {
      i += 2;
      continue;
    }
    i += 2 + buffer.readUInt16BE(i + 2);
  }
  return null;
};

/** What the bytes are, from their signature. */
export const imageKind = (/** @type {Buffer} */ buffer) => {
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return "jpeg";
  if (buffer.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")))
    return "png";
  if (
    buffer.subarray(0, 4).toString("latin1") === "RIFF" &&
    buffer.subarray(8, 12).toString("latin1") === "WEBP"
  )
    return "webp";
  if (buffer.subarray(0, 4).toString("latin1") === "GIF8") return "gif";
  return null;
};

/** ImageMagick's command, which the GitHub runner has; null without it. */
export const imageMagick = () =>
  ["magick", "convert"].find(
    (command) =>
      spawnSync(command, ["-version"], { stdio: "ignore" }).status === 0,
  ) ?? null;

/**
 * `name`, or `name-2`, `name-3`… when a poster of that name is already
 * there: a second "Intro to AI" in the same year must not replace the
 * first one's poster.
 * @param {string} root
 * @param {string} name
 */
export const freePosterName = (root, name) => {
  const dir = join(root, "public/assets/events");
  let candidate = name;
  for (let n = 2; existsSync(join(dir, `${candidate}.jpg`)); n += 1) {
    candidate = `${name}-${n}`;
  }
  return candidate;
};

/**
 * Downloads the poster, stores it as `<name>.jpg` and writes its 600px
 * copy. With `normalize`, every image is re-encoded through ImageMagick
 * (a PNG or WebP becomes a JPEG, transparency goes white, an EXIF
 * rotation is applied, anything wider than `maxWidth` is scaled down), so
 * what is recorded is what is shown. Without it, a JPEG is stored as it
 * came, which is right for Instagram's.
 * @param {string} url
 * @param {string} name file name without the extension
 * @param {{ root: string, normalize?: boolean, maxWidth?: number, log?: (message: string) => void }} options
 * @returns {Promise<{ poster: string, posterWidth: number, posterHeight: number }>}
 */
export const savePoster = async (
  url,
  name,
  { root, normalize = false, maxWidth = 1600, log = console.warn },
) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`${response.status} fetching the poster`);
  let buffer = Buffer.from(await response.arrayBuffer());
  const kind = imageKind(buffer);
  if (!kind) throw new Error("the poster is not an image");
  const convert = imageMagick();

  let size = kind === "jpeg" ? jpegSize(buffer) : null;
  if (normalize || kind !== "jpeg" || !size) {
    if (!convert) {
      throw new Error(
        kind === "jpeg"
          ? "the JPEG's size could not be read and there is no ImageMagick to rewrite it"
          : `the poster is a ${kind.toUpperCase()} and there is no ImageMagick to make a JPEG of it`,
      );
    }
    const work = mkdtempSync(join(tmpdir(), "poster-"));
    try {
      const input = join(work, `input.${kind}`);
      const output = join(work, "output.jpg");
      writeFileSync(input, buffer);
      const result = spawnSync(
        convert,
        [
          `${input}[0]`,
          "-auto-orient",
          "-background",
          "white",
          "-alpha",
          "remove",
          "-alpha",
          "off",
          "-resize",
          `${maxWidth}x>`,
          "-quality",
          "88",
          "-strip",
          output,
        ],
        { stdio: "inherit" },
      );
      if (result.status !== 0)
        throw new Error("ImageMagick could not convert the poster");
      buffer = readFileSync(output);
    } finally {
      rmSync(work, { recursive: true, force: true });
    }
    size = jpegSize(buffer);
  }
  if (!size) throw new Error("could not read the poster's size");

  const dir = join(root, "public/assets/events");
  const file = join(dir, `${name}.jpg`);
  writeFileSync(file, buffer);
  if (convert) {
    const result = spawnSync(
      convert,
      [
        file,
        "-auto-orient",
        "-resize",
        "600x",
        "-quality",
        "82",
        "-strip",
        join(dir, `${name}-600.jpg`),
      ],
      { stdio: "inherit" },
    );
    if (result.status !== 0)
      throw new Error(`ImageMagick could not make ${name}-600.jpg`);
  } else {
    log(`no ImageMagick; make ${name}-600.jpg by hand (see CONTRIBUTING.md)`);
  }
  return { poster: `/assets/events/${name}.jpg`, ...size };
};
