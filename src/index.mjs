import fs from 'node:fs'
import { execSync } from 'node:child_process'
import fp from 'find-free-port'
import chalk from 'chalk'

import { useConsole } from './useConsole.js'
import { absoluteVulmixPaths, isDevMode } from './paths.js'

const ABSOLUTE_ROOT_PATH = absoluteVulmixPaths().absoluteRootPath
const ABSOLUTE_PACKAGE_PATH = absoluteVulmixPaths().absolutePackagePath

const CLI_OPTION = process.argv[2]

function prepare() {
  if (!fs.existsSync(`${ABSOLUTE_ROOT_PATH}/.vulmix`)) {
    fs.mkdirSync(`${ABSOLUTE_ROOT_PATH}/.vulmix`)
  }

  if (!fs.existsSync(`${ABSOLUTE_ROOT_PATH}/.vulmix/laravel-mix`)) {
    fs.mkdirSync(`${ABSOLUTE_ROOT_PATH}/.vulmix/laravel-mix`)

    copyMixFile()
  } else {
    copyMixFile()
  }

  if (!fs.existsSync(`${ABSOLUTE_ROOT_PATH}/.vulmix/types`)) {
    fs.mkdirSync(`${ABSOLUTE_ROOT_PATH}/.vulmix/types`)

    copyTypes()
  } else {
    copyTypes()
  }

  if (!fs.existsSync(`${ABSOLUTE_ROOT_PATH}/.vulmix/utils`)) {
    fs.mkdirSync(`${ABSOLUTE_ROOT_PATH}/.vulmix/utils`)

    copyUtils()
  } else {
    copyUtils()
  }

  execSync(
    `tsc ${ABSOLUTE_ROOT_PATH}/vulmix.config.ts --outDir ${ABSOLUTE_ROOT_PATH}/.vulmix`,
    {
      stdio: 'inherit',
    }
  )
}

function dev() {
  prepare()

  runLaravelMix('hot')
}

function prod() {
  prepare()

  runLaravelMix('prod')
}

function serve() {
  runLaravelMix('serve')
}

function runLaravelMix(mixCommand) {
  fp(3000, function (fpError, freePort) {
    if (fpError) {
      console.log(fpError)

      return
    }

    try {
      const port = freePort
      const serveCommand = `npx http-server -p ${port} -a localhost ${ABSOLUTE_ROOT_PATH}/_dist --gzip --proxy http://localhost:${port}?`
      const command = `mix${
        mixCommand === 'hot' ? ' watch' : ''
      } --mix-config=${ABSOLUTE_ROOT_PATH}/.vulmix/laravel-mix/webpack.mix.js${
        mixCommand === 'hot' ? ` --hot -- --port=${port}` : ''
      }${
        mixCommand === 'prod' || mixCommand === 'serve' ? ' --production' : ''
      }${mixCommand === 'serve' ? ` && ${serveCommand}` : ''}`

      useConsole.clear()
      useConsole.log(chalk.grey(`Vulxi 0.0.2\n`))

      execSync(command, {
        stdio: 'inherit',
      })
    } catch (err) {
      console.log(err)
    }
  })
}

function copyMixFile() {
  fs.copyFileSync(
    `${ABSOLUTE_PACKAGE_PATH}/utils/webpack.mix${isDevMode ? '.dev' : ''}.js`,
    `${ABSOLUTE_ROOT_PATH}/.vulmix/laravel-mix/webpack.mix.js`
  )
}

function copyTypes() {
  fs.copyFileSync(
    `${ABSOLUTE_PACKAGE_PATH}/utils/tsconfig.json`,
    `${ABSOLUTE_ROOT_PATH}/.vulmix/types/tsconfig.json`
  )

  fs.copyFileSync(
    `${ABSOLUTE_PACKAGE_PATH}/types/vue-shims.d.ts`,
    `${ABSOLUTE_ROOT_PATH}/.vulmix/types/vue-shims.d.ts`
  )
}

function copyUtils() {
  fs.copyFileSync(
    `${ABSOLUTE_PACKAGE_PATH}/utils/defineVulmixConfig${
      isDevMode ? '.dev' : ''
    }.ts`,
    `${ABSOLUTE_ROOT_PATH}/.vulmix/utils/defineVulmixConfig.ts`
  )
}

if (CLI_OPTION === 'prepare') {
  prepare()
} else if (CLI_OPTION === 'dev') {
  dev()
} else if (CLI_OPTION === 'prod') {
  prod()
} else if (CLI_OPTION === 'serve') {
  serve()
} else {
  console.log(
    `${chalk.redBright('Invalid command')}${chalk.grey(
      '. You can use:'
    )} vulx dev|prod|serve`
  )
}
