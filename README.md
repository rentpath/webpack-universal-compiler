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

**For a working example check out out [SSR-Example](https://github.com/verydanny/ssr-example)**

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
const middleware = webpackClientServerMiddleware(
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

1. You must add it as an option to the `webpackClientServerMiddleware`.
2. Add `webpack-hot-middleware/client` to your client webpack entry array/object.
3. Add `new webpack.HotModuleReplacementPlugin()` to your array of plugins.

**Important:** To prevent memory leaks, do not have hashes in your `output.filename`, `output.chunkFilename`, `output.hotUpdateMainFilename`, or `hotUpdateChunkFilename`. This is **ONLY** for dev mode. You may enable chunk hashing for production/CDN use.

`src/bin/development.js`
```ts
const options = {
  inMemoryFilesystem: true,
  hot: true
}

const middleware = webpackClientServerMiddleware(
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

## webpackClientServerMiddleware API

`webpack-universal-compiler` itself returns an express (connect) middleware: `(req, res, next): void`, but the middleware object also has the running instance of the dual webpack compiler (client and server). Documentation below shows how to access the compilers.

### `middleware`

This is the middleware that provides your express application with both the client and the server bundles. The middleware provides client and server compilation information in to **`res.locals.universal`**

**Type:** `Function` (express middleware)
<br>
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

### `middleware.compiler`

An object containing information about the compiler running in the background for both client and server.

**Type:** `Object`
<br>
<br>
**Example:**
<br>
```ts
const middleware = webpackClientServerMiddleware(
  clientConfig,
  serverConfig,
  options
)

middleware.compiler.on('end', compilation => {
  if (compilation.clientStats.hasErrors()) {
    //etc
  }
})

app.use(middleware)
```

#### Methods

Most of these `compiler` methods return the same compilation Type.

```ts
type Compilation = {
  duration?: number
  clientStats?: webpack.Stats
  serverStats?: webpack.Stats
}
```

- **`compiler.client`**

  Object containing the client configuration and the instance of the client Compiler `webpack.Compiler`.

- **`compiler.server`**

  Object containing the server configuration and the instance of the server Compiler `webpack.Compiler`.

- **`compiler.isCompiling()`**

  Returns if either the client or server compiler is compiling.

  **Type:** `Function`  
  **Returns:** `boolean`
  
- **`compiler.getCompilation()`**

  Returns the last successful compilation stats.

  **Type:** `Function`  
  **Returns:** `Compilation`

- **`compiler.getError()`**

  Returns errors if there are any, useful mainly for watching. By default errors will get printed to console.

  **Type:** `Function`  
  **Returns:** `webpack.Stats`

- **`compiler.run()`**

  Runs the compiler, this is more for production builds. Not as useful for middleware.

  **Type:** `Function`  
  **Returns:** `Promise<Compilation>`

- **`compiler.watch()`**

  Starts webpack in watch mode. This is useful to pair with `compiler.resolve()` to resolve the last watch-compiled build.

  **Type:** `Function`  

- **`compiler.resolve()`**

  Returns a Promise that resolves to the last compilation sequentially built by webpack's `watch`. This is the backbone of the middleware.

  **Type:** `Function`  
  **Returns:** `Promise<Compilation>`

- **`compiler.on(event: 'begin' | 'end' | 'error' | 'invalidate', cb: Function)`**

  There are a few events you may listen on, and react to with a callback function.

  - `'begin'` - Compiler has started compiling.
  - `'end', stats => void` - Compiler has finished compiling without errors. You have access to the stats object in the callback.
  - `'error', err => void` - Compiler has finished compiling with errors. You have access to error and error stats with `err.stats` (if webpack didn't fail catastraphically).
  - `'invalidate'` - Compiler has invalidated the last watch build.

- **`compiler.emit(event: string | symbol, cb: Function)`**

  You may also add your own emitters if you'd like.

**Important:** All of these methods are available to the `clientServerCompiler` so you can build your own universal webpack compiler that's (more or less) pain free. It does not provide as much error catching, or set up the in-memory filesystem for you, but it streamlines the compilation process and keeps things in-sync.

**Example:**  
<br>
```ts
import { clientServerCompiler } from 'webpack-universal-compiler'

import clientConfig from '../webpack/webpack.client.config'
import serverConfig from '../webpack/webpack.server.config'

const compilerInstance = clientServerCompiler(clientConfig, serverConfig)

const runCompiler = async () => {
  compilerInstance.watch()
  compilerInstance.on('end', async () => {
    const { clientStats, serverStats } = await compilerInstance.resolve()

    // Do stuff with stats, start up server, build your own middleware.
  })
}
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


## Credits

- Moxy Studios - [webpack-isomorphic-dev-middleware](https://github.com/moxystudio/webpack-isomorphic-dev-middleware)
<br>
- Webpack Team - [webpack](https://github.com/webpack)


