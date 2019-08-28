import { clientServerCompiler } from './webpack-isomorphic/simple-isomorphic-compiler'
import webpackClientServerMiddleware from './middleware'

module.exports = {
  webpackClientServerMiddleware,
  clientServerCompiler
}
