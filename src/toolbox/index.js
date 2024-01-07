import prompt from './prompt/index.js'
import template from './template.js'
import fs from './fs/index.js'
import cp from 'child_process'
import ui from './ui.js'
import mergeOptions from './mergeOptions.js'
import store from './store/index.js'

export default ({ payload, options = [], transformers = [], validators = [] }) => {

  const toolbox = {
    payload,
    print: console,
    libraryOptions: options,
    options: [],
    asks: { transformers, validators }
  }

  toolbox.mergeOptions = async (op) => mergeOptions({ handlerOptions: op, toolbox })

  toolbox.ui = ui({ toolbox })
  toolbox.prompt = prompt({ toolbox })
  toolbox.template = template()
  toolbox.fs = fs({ toolbox })
  toolbox.store = store({ toolbox })
  toolbox.spawn = async (command, args, options) => {
    return new Promise(resolve => {
      const result = cp.spawn(command, args, options)
      result.stdout.setEncoding('utf8')
      result.on('close', () => {
        resolve()
      })
      result.stdout.on('data', data => {
        console.log(data)
      })
      result.stderr.on('data', data => {
        console.info('stderr: ' + data)
      })
    })
  }

  return toolbox
}
