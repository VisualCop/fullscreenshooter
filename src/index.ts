import * as Nightmare from "nightmare";
import { join } from "path";
import * as mkdirp from "mkdirp-promise";
import * as rimraf from "rimraf-then";

import { NightmareProvider } from "./NightmareProvider";
import { ISize } from "./types";
import { debugMsg } from "./debug";
import { finalize } from "./Postprocessing";

export default class FullScreenshot {
  private constructor(
    public readonly provider: NightmareProvider,
    public readonly widths: number[],
    public readonly basePath: string,
    public readonly navbarOffset: number
  ) {}

  public static async create(
    nightmare: Nightmare,
    widths: number[],
    basePath: string,
    navbarOffset: number // this should be refactored to more general mechanism
  ): Promise<FullScreenshot> {
    const provider = await NightmareProvider.create(nightmare);
    return new FullScreenshot(provider, widths, basePath, navbarOffset || 0);
  }

  async save(name: string) {
    debugMsg(`Making screenshots for ${name}`);
    for (const width of this.widths) {
      debugMsg(`Making screenshot for size: ${width}`);
      await this.provider.resizeWidth(width);

      const documentHeight = await this.provider.getRealHeight();
      debugMsg("Real height: ", documentHeight);

      const baseDir = join(this.basePath, `${name}-${width}`);
      await mkdirp(baseDir);

      const subImages = [];
      let currentHeight = 0;
      let i = 0;
      while (currentHeight < documentHeight) {
        debugMsg(`Screenshot ${i} at ${currentHeight}`);
        await this.provider.scrollTo(currentHeight);
        const imagePath = join(baseDir, `${name}-${width}-${i++}.png`);
        await this.provider.screenshot(imagePath);

        const isFirst = i === 0;
        currentHeight += this.provider.windowSizes.inner.height - (isFirst ? 0 : this.navbarOffset);
        subImages.push(imagePath);
      }
      const lastImgOffset = currentHeight - documentHeight + this.navbarOffset;

      await finalize(
        subImages,
        { height: this.provider.windowSizes.inner.height, width },
        this.provider.pixelDensity,
        this.provider.scrollbarWidth,
        lastImgOffset,
        this.navbarOffset,
        `./screenshots/${name}-${width}.png`
      );
      // await rimraf(baseDir);
    }
  }
}
