# Fullscreenshot
Driver agnostic tool for reliable creation of full page screenshots 

```sh
npm install --save-dev fullscreenshot
```

## Supported drivers: 
`Fullscreenshot` currently supports these drivers:
- puppeteer (recommended)
- nighmarejs

## Usage:
With `puppeteer`: 

```javascript
const { default: Fullscreenshot } = require('fullscreenshot');

const basePath = join(process.cwd(), "screenshots");
const fullscreenshot = await Fullscreenshot.create({
  basePath,
  navbarOffset: 61,     // offset for sticky navbar
  unreveal: true,       // if page has reveal effects this will scroll it way to the bottom before making screenshots
  widths: [350, 1500],
  puppeteer: page
})

await fullscreenshot.save("index");
```

### How it works:
It creates your full page screenshot by making smaller, screenshots of a given viewport and then merging them together. This is why `navbarOffset` is needed for sticky navbars.
