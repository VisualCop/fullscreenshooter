# Fullscreenshooter
Driver agnostic tool for reliable creation of full page screenshots during e2e tests

```sh
npm install Fullscreenshooter
```

make sure that you have `imagemagick` and `graphicsmagick` installed on your system.

```sh
brew install imagemagick
brew install graphicsmagick
```

or 

```sh
apt-get install -y imagemagick graphicsmagick
```

## Supported drivers: 
`Fullscreenshooter` currently supports these drivers:
- puppeteer (recommended)
- nighmarejs

## Usage:
With `puppeteer`: 

```javascript
const { default: Fullscreenshooter } = require('Fullscreenshooter');

const basePath = join(process.cwd(), "screenshots");
const fullscreenshooter = await Fullscreenshooter.create({
  basePath,
  navbarOffset: 61,     // offset for sticky navbar (optional)
  unreveal: true,       // if page has reveal effects this will scroll it way to the bottom before making screenshots (optional)
  widths: [350, 1500],
  puppeteer: page
})

await fullscreenshooter.save("index");
```

### How it works:
It creates full page screenshot by making smaller, screenshots of a given viewport and then merging them together. That's is why `navbarOffset` is needed to cut off sticky navbars.
