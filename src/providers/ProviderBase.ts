import { IWindowSizes } from '../types'

export abstract class ProviderBase {
  constructor(public readonly info: IProviderInfo) {}

  public abstract async resizeWidth(width: number): Promise<void>;
  public abstract async getRealHeight(): Promise<number>;    
  public abstract async scrollTo(height: number): Promise<number>;
  public abstract async screenshot(path: string): Promise<void>;
  public abstract async execute<T>(func: (...args: any[]) => T, ...args: any[]): Promise<T>;
}

export interface IProviderInfo {
  scrollbarWidth: number
  windowSizes: IWindowSizes
  pixelDensity: number
}