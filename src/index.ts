import * as assert from 'assert'
import * as mkdirp from 'mkdirp-promise'
import * as Nightmare from 'nightmare'
import { join } from 'path'
import * as Puppeteer from 'puppeteer'
import * as rimraf from 'rimraf-then'

import { delay } from 'bluebird'
import { debugMsg } from './debug'
import { finalize } from './Postprocessing'
import { NightmareProvider } from './providers/NightmareProvider'
import { ProviderBase } from './providers/ProviderBase'
import { PuppeteerProvider } from './providers/PuppeteerProvider'

export interface IFullScreenshotOptions {
  nightmare?: Nightmare
  puppeteer?: Puppeteer.Page
  widths: number[]
  basePath: string
  disableAnimations?: string[] // list of selectors to disable animations
  navbarOffset?: number // this should be refactored to more general mechanism
  unreveal?: boolean
}

export default class FullScreenshot {
  public static async create(options: IFullScreenshotOptions): Promise<FullScreenshot> {
    const provider = await createProvider(options)
    return new FullScreenshot(provider, options)
  }

  public readonly provider: ProviderBase
  public readonly options: IFullScreenshotOptions

  private constructor(provider: ProviderBase, options: IFullScreenshotOptions) {
    assert.ok(provider, 'You need to pass provider')
    assert.ok(options.basePath, 'You need to pass basePath')
    assert.ok(options.widths, 'You need to pass widths')
    this.provider = provider
    this.options = options
  }

  public async save(name: string): Promise<void> {
    debugMsg(`Making screenshots for ${name}`)

    if (this.options.unreveal) {
      await this.unreveal()
    }

    if (this.options.disableAnimations) {
      await this.disableAnimations()
    }

    for (const width of this.options.widths) {
      debugMsg(`Making screenshot for size: ${width}`)
      await this.provider.resizeWidth(width)

      const documentHeight = await this.provider.getRealHeight()
      debugMsg('Real height: ', documentHeight)

      const baseDir = join(this.options.basePath, `${name}-${width}`)
      await mkdirp(baseDir)

      const subImages = []
      let currentHeight = 0
      let i = 0
      let realScrollPosition = 0
      let lastScrollPos = 0
      while (currentHeight < documentHeight) {
        debugMsg(`Screenshot ${i} at ${currentHeight}`)
        realScrollPosition = await this.provider.scrollTo(currentHeight)
        const imagePath = join(baseDir, `${name}-${width}-${i++}.png`)
        await this.provider.screenshot(imagePath)

        const isFirst = i === 0
        lastScrollPos = currentHeight
        currentHeight +=
          this.provider.info.windowSizes.inner.height -
          (isFirst ? 0 : this.options.navbarOffset || 0)
        subImages.push(imagePath)
      }
      const lastImgOffset = lastScrollPos - realScrollPosition

      await finalize(
        subImages,
        { height: this.provider.info.windowSizes.inner.height, width },
        this.provider.info.pixelDensity,
        this.provider.info.scrollbarWidth,
        lastImgOffset,
        this.options.navbarOffset || 0,
        `./screenshots/${name}-${width}.png`,
      )
      await rimraf(baseDir)
    }
  }

  public async unreveal(): Promise<void> {
    debugMsg('Unrevealing window')
    const realHeight = await this.provider.getRealHeight()
    const step = this.provider.info.windowSizes.inner.height

    let currentHeight = 0
    while (currentHeight < realHeight) {
      await this.provider.scrollTo(currentHeight)
      await delay(100)
      currentHeight += step
    }
    await this.provider.scrollTo(0)
  }

  public async disableAnimations(): Promise<void> {
    debugMsg('Disabling animations')

    await this.provider.execute(
      (selectors: string) =>
        [...document.querySelectorAll(selectors)].forEach(
          (e: any) => (e.style.animation = 'unset'),
        ),
      this.options.disableAnimations!.join(','),
    )
  }
}

async function createProvider(options: IFullScreenshotOptions): Promise<ProviderBase> {
  if (options.nightmare) {
    return NightmareProvider.create(options.nightmare)
  } else if (options.puppeteer) {
    return PuppeteerProvider.create(options.puppeteer)
  }

  throw new Error('Unrecognized provider!')
}
