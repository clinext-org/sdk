import prompt from './prompt/index.js'
import template from './template.js'
import fs from './fs.js'
import cp from 'child_process'
import ui from './ui.js'
import mergeOptions from './mergeOptions.js'

export default ({ payload, options = [], transformers = [], validators = [] }) => {

  const toolbox = {
    payload,
    print: console,
    libraryOptions: options,
    options: [],
    asks: { transformers, validators }
  }


  toolbox.mergeOptions = (op) => mergeOptions({ handlerOptions: op, toolbox })

  toolbox.ui = ui({ toolbox })
  toolbox.prompt = prompt({ toolbox })
  toolbox.template = template({ toolbox })
  toolbox.fs = fs({ toolbox })
  toolbox.spawn = async (command, args, options) => {
    return new Promise(resolve => {
      const result = cp.spawn(command, args, options)
      result.on('close', () => {
        resolve()
      })
    })
  }

  return toolbox
}
