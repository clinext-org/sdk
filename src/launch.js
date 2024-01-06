// https://medium.com/netscape/a-guide-to-create-a-nodejs-command-line-package-c2166ad0452e
// https://www.reddit.com/r/node/comments/12uak6h/npx_not_running_correctly/
// https://docs.npmjs.com/cli/v9/configuring-npm/package-json#bin
// https://github.com/yargs/yargs/issues/1844#issuecomment-998966393
// https://github.com/yargs/yargs/issues/225#issuecomment-699540088
// https://github.com/lirantal/nodejs-cli-apps-best-practices

// https://stackoverflow.com/a/69503617
/*
chmod +x ./dist/app.cjs
yarn link
servable
*/
import * as dotenv from 'dotenv';
import _yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'fs';
import registerCommands from './commands/index.js';
import loadTransformers from './load/transformers/index.js';
import _path from 'path';
import { fileURLToPath } from "url";
import { dirname } from "path";
import getFileCallerURL from './lib/getFileCallerURL.js';
import loadOptions from './load/options/index.js';
import loadValidators from './load/validators/index.js';
import buildToolbox from './toolbox/index.js';
import loadEnv from './load/env.js';
import loadExtensions from './load/extensions/index.js';
dotenv.config()
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default async ({ path, npmPackage, config } = {}) => {

  // import options from './options.js';
  let __actualPath = path
  if (!__actualPath) {
    const ce = getFileCallerURL()
    __actualPath = _path.dirname(ce)
    __actualPath = __actualPath.replace('file://', '')
  }


  let __actualNpmPackage = npmPackage
  if (!__actualNpmPackage) {
    const __d = _path.resolve(__actualPath, '../package.json')
    if (fs.existsSync(__d)) {
      __actualNpmPackage = JSON.parse(fs.readFileSync(__d).toString())
    }
  }
  if (!__actualNpmPackage) {
    __actualNpmPackage = { version: "0.0.0" }
  }

  let __actualConfig = config
  if (!__actualConfig) {
    const __d = _path.resolve(__actualPath, '../cli.config.json')
    if (fs.existsSync(__d)) {
      __actualConfig = JSON.parse(fs.readFileSync(__d).toString())
    }
  }
  if (!__actualConfig) {
    __actualConfig = {}
  }
  //https://github.com/yargs/yargs/issues/569



  const yargs = _yargs(hideBin(process.argv))


  yargs
    // .options(options)
    .usage('Usage: servable <command>')
    .demandCommand(1)
    .wrap(Math.min(yargs.terminalWidth(), 160))
    .help('help')
    .alias('help', 'h')
    .version(__actualNpmPackage.version)
    .alias('version', 'v')
    .hide('help')
    .hide('version')
    .epilog('Made by Servable.')

  const options = await loadOptions({
    path: __actualPath,
    config: __actualConfig
  })

  const transformers = {
    in: await loadTransformers({
      path: `${__actualPath}/transformers/in`,
    }),
    out: await loadTransformers({
      path: `${__actualPath}/transformers/out`,
    }),
    display: await loadTransformers({
      path: `${__actualPath}/transformers/display`,
    }),
  }

  let validators = await loadValidators({
    path: _path.resolve(__dirname, "./validators"),
    config: __actualConfig,
    options,
  })
  validators = {
    ...validators,
    ...(await loadValidators({
      path: `${__actualPath}/validators`,
      config: __actualConfig,
      options,
    }))
  }

  const payload = {}
  const toolbox = buildToolbox({
    payload,
    options,
    yargs,
    transformers,
    validators
  })


  await loadEnv({
    projectSrcPath: __actualPath,
    toolbox
  })
  await loadExtensions({
    path: `${__actualPath}/extensions`, toolbox
  })

  global.CliNext = toolbox

  await registerCommands({
    path: __actualPath,
    yargs,
    config: __actualConfig,
    options,
    toolbox,
    payload
  })


}
