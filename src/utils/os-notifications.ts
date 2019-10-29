import * as path from "path"
import notifier from "node-notifier"
import readPkgUp from "read-pkg-up"
import stripAnsi from "strip-ansi"
import renderers from "../helpers/renderers"

import {
  UniversalCompiler,
  SimpleCompiler,
  ErrWithStats
} from "../types/compiler"

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

    if (pkgUp && pkgUp.packageJson.name) {
      defaultTitle = pkgUp.packageJson.name
    } else {
      defaultTitle = "Unknown Project"
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
  compiler: UniversalCompiler | SimpleCompiler,
  options: NotifierOptions
) {
  options = {
    title: undefined,
    icon: path.resolve(__dirname, "../../webpack-logo.png"),
    sound: false,
    ...options
  }

  options.title = options.title || getDefaultTitle()

  let lastBuildSucceeded = false
  const notify = createNotifier(options)

  const onError = (err: ErrWithStats) => {
    lastBuildSucceeded = false
    const message = stripAnsi(renderers.error(err))

    notify(message)
  }

  const onEnd = () => {
    if (!lastBuildSucceeded) {
      lastBuildSucceeded = true
      notify("Build Successful")
      lastBuildSucceeded = false
    }
  }

  const stopNotifying = () => {
    compiler.removeListener("end", onEnd)
    compiler.removeListener("error", onError)
  }

  compiler.on("error", onError).on("end", onEnd)

  return {
    stop: stopNotifying,
    options
  }
}
