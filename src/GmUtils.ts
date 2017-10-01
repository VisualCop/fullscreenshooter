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

export interface ICropArea extends ISize{
  x?: number;
  y?: number;
}

export function crop(path: string, area: ICropArea): Promise<void> {
  return promisify(cb =>
    gm(path)
      .crop(area.width, area.height, area.x || 0, area.y || 0)
      .write(path, cb)
  )() as any;
}
