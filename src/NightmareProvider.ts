import * as Nightmare from "nightmare";
import { ISize, IWindowSizes } from "./types";
import { debugMsg } from "./debug";
import * as gm from "gm";
import { promisify } from "util";

export class NightmareProvider {
  private constructor(
    private readonly nightmare: Nightmare,
    public readonly scrollbarWidth: number,
    public readonly windowSizes: IWindowSizes,
    public readonly pixelDensity: number
  ) {
    debugMsg(`Detected scrollbar width: ${scrollbarWidth}`);
  }

  public static async create(nightmare: Nightmare): Promise<NightmareProvider> {
    const scrollbarWidth = await getScrollbarWidth(nightmare);
    const windowSizes = await getWindowSizes(nightmare);
    const pixelDensity = await getPixelDensity(nightmare);

    return new NightmareProvider(nightmare, scrollbarWidth, windowSizes, pixelDensity);
  }

  public async execute<T>(func: (...args: any[]) => T): Promise<T> {
    return (this.nightmare.evaluate(func) as any) as Promise<T>;
  }

  public async resizeWidth(width: number): Promise<void> {
    console.log("pixelDensity", await this.execute(() => window.devicePixelRatio));

    await this.nightmare.viewport(width + this.scrollbarWidth, this.windowSizes.outer.height);
    await this.nightmare.wait(100);
  }

  public async screenshot(path: string): Promise<void> {
    await this.nightmare.screenshot(path);
  }
}

async function getScrollbarWidth(nightmare: Nightmare): Promise<number> {
  const width = await nightmare.evaluate(() => {
    var outer = document.createElement("div");
    outer.style.visibility = "hidden";
    outer.style.width = "100px";
    outer.style.msOverflowStyle = "scrollbar";

    document.body.appendChild(outer);

    var widthNoScroll = outer.offsetWidth;
    // force scrollbars
    outer.style.overflow = "scroll";

    var inner = document.createElement("div");
    inner.style.width = "100%";
    outer.appendChild(inner);

    var widthWithScroll = inner.offsetWidth;

    outer.parentNode!.removeChild(outer);

    return widthNoScroll - widthWithScroll;
  });

  return width as any;
}

async function getWindowSizes(nightmare: Nightmare): Promise<IWindowSizes> {
  return nightmare.evaluate(() => ({
    outer: {
      width: window.outerWidth,
      height: window.outerHeight,
    },
    inner: {
      width: window.innerWidth,
      height: window.innerHeight,
    }
  })) as any;
}

async function getPixelDensity(nightmare: Nightmare): Promise<number> {
  return nightmare.evaluate(() => window.devicePixelRatio) as any;
}
