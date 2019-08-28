import { Compiler, MultiCompiler } from 'webpack'
import { clientServerCompiler } from './webpack-isomorphic/simple-isomorphic-compiler'

function parseArgs(args: [(MultiCompiler | Compiler), Compiler, object?]): any
function parseArgs(args: [(MultiCompiler | Compiler), Compiler?, object?]) {
  const [argOne, argTwo, argThree] = args

  if ('compilers' in argOne) {
    return console.log('This is a multi-compiler instance')
  }

  if (argOne.run && argTwo && argTwo.run) {
    return {
      compiler: clientServerCompiler(argOne, argTwo)
    }
  }
}

export default function webpackClientServerMiddleware(
  ...args: [(MultiCompiler | Compiler), Compiler, object]
): any
export default function webpackClientServerMiddleware(
  ...args: [(MultiCompiler | Compiler), Compiler, object]
) {
  const { compiler } = parseArgs(args)
}
