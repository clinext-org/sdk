import ask from './ask.js'
import Bluebird from "bluebird"
import _promptModule from './promptModule.js'

import inquirerPromptAutocomplete from 'inquirer-autocomplete-prompt'
import inquirerFileTreeSelection from 'inquirer-file-tree-selection-prompt'
import inquirerParseJsonFile from 'inquirer-parse-json-file'

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

          if (fullQuestion.prompt && fullQuestion.prompt.transformers && fullQuestion.prompt.transformers.length) {
            let asksTransformers = generator.asks.transformers
            asksTransformers = asksTransformers.filter(a => {
              const mId = a.index.id
              let contains = false
              for (let i in fullQuestion.prompt.transformers) {
                if (fullQuestion.prompt.transformers[i].id === mId) {
                  contains = true
                  break
                }
              }
              return contains
            })

            if (asksTransformers && asksTransformers.length) {
              await Bluebird.Promise.mapSeries(
                asksTransformers,
                async askTransformer => {
                  fullQuestion = await askTransformer.run({
                    question: fullQuestion,
                    payload: generator.payload,
                    generator,
                    promptModule,
                    promptType
                  })
                })
            }
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

          const v = await ask({
            question: fullQuestion,
            payload: generator.payload,
            generator,
            promptModule,
            promptType, validators
          })

          result[question.name] = v
          return v
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

