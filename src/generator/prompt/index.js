import ask from './ask.js'
import Bluebird from "bluebird"
import _promptModule from './promptModule.js'

import inquirerPromptAutocomplete from 'inquirer-autocomplete-prompt'
import inquirerFileTreeSelection from 'inquirer-file-tree-selection-prompt'
import inquirerParseJsonFile from 'inquirer-parse-json-file'
import ejs from 'ejs'
import chalk from 'chalk'


export default ({ generator }) => {

  const prompt = {
    ask: async (value) => {
      const questions = Array.isArray(value) ? value : [value]
      const result = {}
      await Bluebird.Promise.mapSeries(
        questions,
        async question => {
          let fullQuestion = {
            ...question
          }
          const items = generator.options.filter(a => a.name === question.name)
          if (items && items.length) {
            fullQuestion = {
              ...items[0],
              ...fullQuestion
            }
          }
          const { type: promptType = 'input',
            module: _f
          } = fullQuestion.prompt ? fullQuestion.prompt : {}

          let promptModule = _f ? _f : _promptModule()
          if (typeof promptModule === 'string') {
            promptModule = _promptModule(_f)
          }

          if (fullQuestion.prompt
            && fullQuestion.prompt.transformers
            && fullQuestion.prompt.transformers.in
            && fullQuestion.prompt.transformers.in.length) {
            await Bluebird.Promise.mapSeries(
              fullQuestion.prompt.transformers.in,
              async transformerRaw => {
                const transformer = generator.asks.transformers.in[transformerRaw.id]
                if (!transformer) {
                  return
                }
                fullQuestion = await transformer.handler({
                  question: fullQuestion,
                  payload: generator.payload,
                  generator,
                  promptModule,
                  promptType
                })
              })
          }

          let validators = []
          let validatorsPayloads = fullQuestion.validators
          if (validatorsPayloads && validatorsPayloads.length) {
            const libraries = generator.asks.validators

            for (var i in validatorsPayloads) {
              const payload = validatorsPayloads[i]
              if (payload.regex) {
                validators.push(payload)
                continue
              }
              for (var i in libraries) {
                const runner = await libraries[i](payload)
                if (!runner) {
                  continue
                }
                validators.push({
                  ...payload,
                  runner
                })
                break
              }
            }
          }

          fullQuestion.value = await ask({
            question: fullQuestion,
            payload: generator.payload,
            generator,
            promptModule,
            promptType, validators
          })

          let modified
          if (fullQuestion.prompt
            && fullQuestion.prompt.transformers
            && fullQuestion.prompt.transformers.out
            && fullQuestion.prompt.transformers.out.length) {
            await Bluebird.Promise.mapSeries(
              fullQuestion.prompt.transformers.out,
              async transformerRaw => {
                const { template } = transformerRaw
                if (template) {
                  fullQuestion.value = ejs.render(template, {
                    ...generator.payload,
                    value: fullQuestion.value,
                  })
                  modified = true
                  return
                }

                const transformer = generator.asks.transformers.out[transformerRaw.id]
                if (!transformer) {
                  return
                }
                fullQuestion.value = await transformer.handler({
                  value: fullQuestion.value,
                  question: fullQuestion,
                  payload: generator.payload,
                  generator,
                  promptModule,
                  promptType
                })
                modified = true
              })
          }

          if (modified) {
            generator.print.log(`${chalk.green('✓')} ${chalk.italic.bold(fullQuestion.message ? fullQuestion.message : fullQuestion.name)} ${chalk.italic(fullQuestion.value)}`)
          }
          generator.payload[fullQuestion.name] = fullQuestion.value
          result[fullQuestion.name] = fullQuestion.value
          return fullQuestion.value
        })
      return result
    },
    confirm: async () => {

    },
    registerPrompt: (promptModule, key, module) => {
      promptModule.registerPrompt(key, module)
    }
  }

  const promptModule = _promptModule()
  prompt.registerPrompt(promptModule, 'autocomplete', inquirerPromptAutocomplete)
  prompt.registerPrompt(promptModule, 'file-tree-selection', inquirerFileTreeSelection)
  prompt.registerPrompt(promptModule, 'json-file', inquirerParseJsonFile)

  return prompt
}

