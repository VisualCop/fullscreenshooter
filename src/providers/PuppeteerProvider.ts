import { Page as PuppeteerPage } from 'puppeteer'

import { delay } from "bluebird";
import { debugMsg } from '../debug'
import { IWindowSizes } from '../types'
import {IProviderInfo, ProviderBase} from './ProviderBase';

export class PuppeteerProvider extends ProviderBase {
  public static async create(puppeteer: PuppeteerPage): Promise<PuppeteerProvider> {
    const scrollbarWidth = 0
    const pixelDensity = 1
    const windowSizes = await getWindowSizes(puppeteer)

    return new PuppeteerProvider(puppeteer, {
      scrollbarWidth,
      windowSizes,
      pixelDensity,
    })
  }
  
  // @todo check if this shadowing info really works
  private constructor(public readonly puppeteer: PuppeteerPage, info: IProviderInfo) {
    super(info)
    debugMsg(`Detected provider info: `, this.info)
  }

  public async execute<T>(func: (...args: any[]) => T): Promise<T> {
    return (this.puppeteer.evaluate(func) as any) as Promise<T>
  }

  public async resizeWidth(width: number): Promise<void> {
    await this.puppeteer.setViewport({
        deviceScaleFactor: 1,
        width: width + this.info.scrollbarWidth,
        height:this.info.windowSizes.outer.height,
    })
    await delay(100);
  }

  public async screenshot(path: string): Promise<void> {
    await this.puppeteer.screenshot({path})
  }

  public async getRealHeight(): Promise<number> {
    return this.execute(() => document.body.scrollHeight)
  }

  public async scrollTo(height: number): Promise<number> {
    const realScrollPosition = await this.puppeteer.evaluate(
      ((h: number) => {
        window.scrollTo(0, h)
        return window.scrollY
      }) as any,
      height as any,
    )

    return realScrollPosition as any
  }
}

async function getWindowSizes(puppeteer: PuppeteerPage): Promise<IWindowSizes> {
  return puppeteer.evaluate(() => ({
    outer: {
      width: window.outerWidth,
      height: window.outerHeight,
    },
    inner: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
  })) as any
}