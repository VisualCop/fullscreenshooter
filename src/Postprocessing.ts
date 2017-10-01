import * as gm from "gm";
import { ISize } from "./types";
import { debugMsg } from "./debug";
import { getSize, resize, crop } from "./GmUtils";
import * as assert from "assert";

export async function preprocess(
  path: string,
  desiredDimensions: ISize,
  pixelDensity: number,
  scrollbarWidth: number,
  navbarOffset?: number
) {
  debugMsg(`Preprocessing ${path}`);
  if (pixelDensity !== 1) {
    debugMsg("Detected pixelDensity != 1. Scaling down images...");

    const size = await getSize(path);
    const outputDimensions = {
      width: size.width / pixelDensity,
      height: size.height / pixelDensity,
    };

    await resize(path, outputDimensions);
    debugMsg("Resize completed");
  }

  if (scrollbarWidth !== 0) {
    debugMsg("Detected scrollbarWidth != 0. Cutting it off");

    const size = await getSize(path);
    const outputDimensions = {
      width: size.width - scrollbarWidth,
      height: size.height,
    };
    await crop(path, { width: outputDimensions.width, height: outputDimensions.height });
  }

  if (navbarOffset) {
    debugMsg("Detected navbarOffset != 0. Cutting it off");

    const size = await getSize(path);
    const outputDimensions = {
      width: size.width,
      height: size.height - navbarOffset,
    };
    await crop(path, { width: outputDimensions.width, height: outputDimensions.height, y: navbarOffset });
  }

  const finalSize = await getSize(path);
  debugMsg("Final size: ", finalSize);
  assert.equal(desiredDimensions.width, finalSize.width, "Width doesnt match!");
  assert.equal(desiredDimensions.height - ( navbarOffset || 0 ), finalSize.height, "Height doesnt match!");
}

function getImageHeight(index: number, allImagesLength: number, baseHeight: number, lastOffset: number, navbarHeight: number) {
  const isFirst = index === 0;
  const isLast = index === allImagesLength - 1;

  if (isFirst) {
    return baseHeight;
  }

  if (isLast) {
    return baseHeight - lastOffset - navbarHeight;
  }

  return baseHeight - navbarHeight;
}

function stitchImages(images: string[], height: number, lastOffset: number, navbarHeight: number, outputName: string) {
  debugMsg("Stitching images: ", images.length);
  return new Promise((resolve, reject) => {
    let acc = (gm as any)();

    let currentHeight = 0;
    for (var i = 0; i < images.length; i++) {
      const isLast = i === images.length - 1;
      acc = acc
        .in("-page", `+0+${isLast ? currentHeight - lastOffset : currentHeight}`)
        .in(images[i]);

      const imageHeight = getImageHeight(i, images.length, height, lastOffset, navbarHeight);
      debugMsg("Detected image height: ", imageHeight, " of ", i);
      currentHeight += imageHeight;
    }

    acc.mosaic().write(outputName, (err: Error) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export async function finalize(
  subImages: string[],
  desiredDimensions: ISize,
  pixelDensity: number,
  scrollbarWidth: number,
  lastImgOffset: number,
  navbarOffset: number,
  outputPath: string
) {
  for (const [index, subImage] of subImages.entries()) {
    const isFirst = index === 0;
    if (isFirst) {
      await preprocess(subImage, desiredDimensions, pixelDensity, scrollbarWidth);
    } else {
      await preprocess(subImage, desiredDimensions, pixelDensity, scrollbarWidth, navbarOffset);
    }
  }

  await stitchImages(subImages, desiredDimensions.height, lastImgOffset, navbarOffset, outputPath);
}
