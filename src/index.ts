import * as Nightmare from 'nightmare';
import { NightmareProvider } from "./NightmareProvider";
import { join } from "path";
import { ISize } from "./types";
import { debugMsg } from './debug';
import { preprocess } from "./Postprocessing";

export default class FullScreenshot {
  private constructor(public readonly provider: NightmareProvider, public readonly widths: number[], public readonly basePath: string) {}

  public static async create(nightmare: Nightmare, widths: number[], basePath: string): Promise<FullScreenshot> {
    const provider = await NightmareProvider.create(nightmare);
    return new FullScreenshot(provider, widths, basePath);
  }

  async save(name: string) {
    debugMsg(`Making screenshots for ${name}`);
    for (const width of this.widths) {
      debugMsg(`Making screenshot for size: ${width}`);
      await this.provider.resizeWidth(width);
      const resultPath = join(this.basePath, `${name}-${width}.png`);
      await this.provider.screenshot(resultPath);
      await preprocess(resultPath, { height: this.provider.actualSize.height, width })
    }
  }
}