import * as gm from 'gm';
import { ISize } from "./types";
import { debugMsg } from "./debug";

export function preprocess(path:string, desiredDimensions: ISize) {
  debugMsg(`Preprocessing ${path}`);
  return new Promise((resolve, reject) => {
    gm(path)
      .resize(desiredDimensions.width, desiredDimensions.height)
      .write(path, function (err) {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
  })
}
