# Webpack Universal Compiler

A toolkit to make your universal web app MUCH easier to develop. I've noticed a weird disconnect between client and server development methods, and this attempts to bridge that gap. Thanks to [webpack-isomorphic-dev-middleware](https://github.com/moxystudio/webpack-isomorphic-dev-middleware). I typed out most of the code, patched up the in-memory filesystem, and updated his package for more use cases.

## Getting Started

Webpack Universal Compiler is still at alpha so use with caution. It should be just a single package installation to get your webpack universal development off the ground.

## Installing

**Yarn**
```
yarn webpack-universal-compiler -D
```

**NPM**
```
npm install webpack-universal-compiler --save-dev
```

## Prerequisites


It's important that your server side bundle exports middleware in the form of `(req, res, next) => void`. You may export many middleware if you'd like and then compose them together. We will be using the following 2 webpack entry files as examples. Some examples of usage are below. This package allows a lot of flexibility, so use as you wish.

### Example Client webpack entry
`src/client/entry.ts`
```ts
import React from 'react'
import { hydrate } from 'react-dom'
import App from '../app/containers/app'

hydrate(<App />, document.querySelector('.app-root'))
```

### Example Server webpack entry
`src/server/entry.ts`
```ts
import { logger } from './middleware/logger'
import { someOtherMiddleware } from './middleware/someOtherMiddleware'
import { reactRenderer } from './middleware/render'

export const middleware = [
  logger,
  someOtherMiddleware,
  reactRenderer
]
```

## Usage

### As an express middleware
`src/bin/development.js`
```ts
import express from 'express'
import * as path from 'path'
import { webpackClientServerMiddleware } from 'webpack-universal-compiler'
import { compose } from 'compose-middleware'

// Import your various webpack configs
import clientConfig from '../webpack/webpack.client.config'
import serverConfig from '../webpack/webpack.server.config'

const app = express()
const options = {
  inMemoryFilesystem: true
}
const { middleware } = webpackClientServerMiddleware(
  clientConfig,
  serverConfig,
  options
)

app.use(middleware)

app.use((req,, res, next) => {
  if (res.locals.universal && res.locals.universal.bundle) {
    // This is the middleware export from `src/server/entry.ts
    const { middleware } = res.locals.universal.bundle

    return compose(middleware)(req, res, next)
  }

  return next()
})

app.listen(8080, () => {
  console.log('Listening on port 8080')
})
```

### With hot reloading
Hot reloading should be simple.

1. You must add it as an option to the middleware.
2. Add 'webpack-hot-middleware/client' to your client webpack entry array/object.
3. Add `new webpack.HotModuleReplacementPlugin()` to your array of plugins.

**Important:** To prevent memory leaks, do not have hashes in your `output.filename`, `output.chunkFilename`, `output.hotUpdateMainFilename`, or `hotUpdateChunkFilename`. This is **ONLY** for dev mode. You may enable chunk hashing for production/CDN use.

`src/bin/development.js`
```ts
const options = {
  inMemoryFilesystem: true,
  hot: true
}

const { middleware } = webpackClientServerMiddleware(
  clientConfig,
  serverConfig,
  options
)

app.use(middleware)
```

`webpack/webpack.client.config`
```js
import * as path from 'path'
import webpack from 'webpack'

module.exports = {
  ...,
  entry: [
    'webpack-hot-middleware/client',
    path.resolve(__dirname, '../src/client.ts')
  ],
  output {
    // if using inMemoryFilesystem
    chunkFilename: '[name].js',
    hotUpdateMainFilename: 'main.hot-update.json',
    hotUpdateChunkFilename: '[id].hot-update.js',

  },
  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ]
}

```

## API

The `webpack-universal-compiler` itself has 3 exports: **`simpleWebpackCompiler`**, **`clientServerCompiler`**, and **`webpackClientServerMiddleware`**. WebpackClientServerMiddleware uses the other compilers as the backbone to construct a compilation that's in-sync.

## webpackClientServerMiddleware API

`webpack-universal-compiler` provides a very useful method (besides the middleware), the compiler instance.

### `middleware`

This is the middleware that provides your express application with both the client and the server bundles. The middleware provides client and server compilation information in to **`res.locals.universal`**

**Type:** `Function` (express middleware)
<br>
**Example:**
<br>
```ts
const { middleware } = webpackClientServerMiddleware(
  clientConfig,
  serverConfig,
  options
)

app.use(middleware)

app.use((req, res, next) => {
  type Compilation = {
    duration: number,
    clientStats: webpack.Stats,
    serverStats: webpack.Stats,
    // This is your server entry file exports
    bundle: Object [Module] { [x: string ]: [Getter] }
  }

  const compilation: Compilation = res.locals.compilation
})
```

### `compiler`

**Type:** `Object`
<br>

An object containing information about the compiler running in the background for both client and server. It has useful methods such as `on`, `getCompilation()`, and more.
<br>
**Example:**
<br>
```ts
const { middleware, compiler } = webpackClientServerMiddleware(
  clientConfig,
  serverConfig,
  options
)

compiler.on('end', compilation => {
  if (compilation.clientStats.hasErrors()) {
    //etc
  }
})

app.use(middleware)
```



## webpackClientServerMiddleware Options

### Compiler, Configuration, or Configuration[]

**Type:** `MultiCompiler | Compiler | Configuration | [ Configuration, Configuration ]`

You may supply either a webpack multicompiler: `webpack([ config1, config2 ])`, a single compiler, `webpack(config)`, an array of configs, or single configs.

**IMPORTANT:** The client config must come first, `webpack-universal-compiler` tries to warn you about order, but sometimes it can't determine based on ones strange webpack configs.
<br>
<br>
**Example:**
```ts
const clientCompiler = webpack(clientConfig)
const serverCompiler = webpack(serverConfig)

const MultiCompiler = [clientCompiler, serverCompiler]

const { middleware } = webpackClientServerMiddleware(MultiCompiler)

// or

const { middleware } = webpackClientServerMiddleware(clientCompiler, serverCompiler)

// 

const { middleware } = webpackClientServerMiddleware(clientConfig, serverConfig)
```

### Middleware Options

**Type:** `Object`

### `inMemoryFilesystem`
**Type:** `boolean`   
**Default:** `false`

Creates an in-memory filesystem for faster compilation. Dynamic imports and split chunks work too due to a patched memory filesystem. So `import()` server-side works how it would client-side, no need to add strange babel plugins.

### `hot`
**Type:** `boolean`  
**Default:** `false`

Injects the hot-dev-middleware into final list of middleware. You must set client webpack config options to support this, otherwise it won't work.

### `headers`
**Type:** `Object`  
**Default:** ` { 'Cache-Control': 'max-age=0, must-revalidate' }`

Headers to provide to the `webpack-dev-middleware`. 







