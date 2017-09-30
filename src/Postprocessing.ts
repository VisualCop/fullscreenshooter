import * as gm from "gm";
import { ISize } from "./types";
import { debugMsg } from "./debug";
import { getSize, resize, crop } from "./GmUtils";
import * as assert from "assert";

export async function preprocess(
  path: string,
  desiredDimensions: ISize,
  pixelDensity: number,
  scrollbarWidth: number
) {
  debugMsg(`Preprocessing ${path}`);
  // move stiching images
  // make it faster on ci

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
    debugMsg("Detected scrollbarWidth != 0. Cut it off");
    console.log("scrollbarWidth", scrollbarWidth);

    const size = await getSize(path);
    console.log("size", size);
    const outputDimensions = {
      width: size.width - scrollbarWidth,
      height: size.height,
    };
    await crop(path, { width: outputDimensions.width, height: outputDimensions.height });
  }

  const finalSize = await getSize(path);
  debugMsg("Final size: ", finalSize);
  assert.equal(desiredDimensions.width, finalSize.width, "Width doesnt match!");
  assert.equal(desiredDimensions.height, finalSize.height, "Height doesnt match!");
}
