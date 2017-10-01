import * as assert from 'assert'
import * as mkdirp from 'mkdirp-promise'
import * as Nightmare from 'nightmare'
import { join } from 'path'
import * as rimraf from 'rimraf-then'

import { delay } from 'bluebird'
import { debugMsg } from './debug'
import { NightmareProvider } from './NightmareProvider'
import { finalize } from './Postprocessing'
import { ISize } from './types'

export interface IFullScreenshotOptions {
  nightmare: Nightmare
  widths: number[]
  basePath: string
  navbarOffset?: number // this should be refactored to more general mechanism
  unreveal?: boolean
}

export default class FullScreenshot {
  public static async create(options: IFullScreenshotOptions): Promise<FullScreenshot> {
    const provider = await NightmareProvider.create(options.nightmare)
    return new FullScreenshot(provider, options)
  }

  public readonly provider: NightmareProvider
  public readonly options: IFullScreenshotOptions

  private constructor(provider: NightmareProvider, options: IFullScreenshotOptions) {
    assert.ok(provider, 'You need to pass provider')
    assert.ok(options.basePath, 'You need to pass basePath')
    assert.ok(options.widths, 'You need to pass widths')
    this.provider = provider
    this.options = options
  }

  public async save(name: string) {
    debugMsg(`Making screenshots for ${name}`)

    if (this.options.unreveal) {
      await this.unreveal()
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

  public async unreveal() {
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
}
