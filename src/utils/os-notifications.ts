import * as path from 'path'
import notifier from 'node-notifier'
import readPkgUp from 'read-pkg-up'
import stripAnsi from 'strip-ansi'
import renderers from '../helpers/renderers'

import { ClientServerCompiler, SimpleCompiler } from '../types/compiler'

export interface NotifierOptions {
  title?: string
  icon?: string
  sound?: boolean
  message?: string
  notify?: boolean
}

let defaultTitle: string

function getDefaultTitle() {
  if (!defaultTitle) {
    const pkgUp = readPkgUp.sync()

    if (pkgUp && pkgUp.package.name) {
      defaultTitle = pkgUp.package.name
    } else {
      defaultTitle = 'Unknown Project'
    }
  }

  return defaultTitle
}

function createNotifier({ title, icon, sound }: NotifierOptions) {
  return (message: string) =>
    notifier.notify({
      title,
      message,
      sound,
      icon
    })
}

export function startNotifying(
  compiler: ClientServerCompiler | SimpleCompiler,
  options: NotifierOptions
) {
  options = {
    title: undefined,
    icon: path.resolve(__dirname, '../../webpack-logo.png'),
    sound: false,
    ...options
  }

  options.title = options.title || getDefaultTitle()

  let lastBuildSucceeded = false
  const notify = createNotifier(options)

  const onError = err => {
    lastBuildSucceeded = false
    const message = stripAnsi(renderers.error(err))

    notify(message)
  }

  const onEnd = () => {
    if (!lastBuildSucceeded) {
      lastBuildSucceeded = true
      notify('Build Successful')
    }
  }

  const stopNotifying = () => {
    compiler.removeListener('end', onEnd)
    compiler.removeListener('error', onError)
  }

  compiler.on('error', onError).on('end', onEnd)

  return {
    stop: stopNotifying,
    options
  }
}
