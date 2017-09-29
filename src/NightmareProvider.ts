import * as Nightmare from 'nightmare';
import { ISize } from "./types";

export class NightmareProvider {
  private constructor(private readonly nightmare: Nightmare, 
    private readonly scrollbarWidth: number,
    public readonly actualSize: ISize) {
  }

  public static async create(nightmare: Nightmare): Promise<NightmareProvider> {
    const scrollbarWidth = await getScrollbarWidth(nightmare);
    const actualSize = await getWindowSize(nightmare);

    return new NightmareProvider(nightmare, scrollbarWidth, actualSize);
  }

  public async execute<T>(func: (...args : any[]) => T): Promise<T> {
    return (this.nightmare.evaluate(func)) as any as Promise<T>;
  }

  public async resizeWidth(width: number): Promise<void> {
    await this.nightmare.viewport(width, this.actualSize.height);
    await this.nightmare.wait(200);
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

async function getWindowSize(nightmare: Nightmare): Promise<ISize> {
  return nightmare.evaluate(() => ({
    width: window.outerWidth,
    height: window.outerHeight,
  })) as any;
}