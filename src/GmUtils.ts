import * as gm from "gm";
import { ISize } from "./types";
import { promisify } from "bluebird";

export function getSize(path: string): Promise<ISize> {
  return promisify(cb => gm(path).size(cb))() as any;
}

export function resize(path: string, size: ISize): Promise<void> {
  return promisify(cb =>
    gm(path)
      .resize(size.width, size.height)
      .write(path, cb)
  )() as any;
}

export function crop(path: string, size: ISize): Promise<void> {
  console.log("size: ", size);
  return promisify(cb =>
    gm(path)
      .crop(size.width, size.height, 0, 0)
      .write(path, cb)
  )() as any;
}
