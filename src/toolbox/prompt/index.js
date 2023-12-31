import ask from './ask.js'
import Bluebird from "bluebird"
import _promptModule from './promptModule.js'

import inquirerPromptAutocomplete from 'inquirer-autocomplete-prompt'
import inquirerFileTreeSelection from 'inquirer-file-tree-selection-prompt'
import inquirerParseJsonFile from 'inquirer-parse-json-file'
import ejs from 'ejs'
import chalk from 'chalk'


const conditionIsMet = ({ conditions, payload }) => {
  if (!conditions || !conditions.length) {
    return true
  }

  let meetsConditions = true
  for (var i in conditions) {
    const condition = conditions[i]
    const { name, operator, operand } = condition
    const targetValue = payload[name]
    if (!operator && !targetValue) {
      meetsConditions = false
      break
    }

    switch (operator) {
      case '=': {
        meetsConditions = targetValue === operand
        if (!meetsConditions) {
          break
        }
      }
      default:
        break
    }
  }

  return meetsConditions
}

const handleSideEffects = async ({ toolbox, questions, question, position = 'after' }) => {

  if (!question.sideEffects || !question.sideEffects.length) {
    return
  }

  await Promise.all(question.sideEffects.map(async sideEffect => {
    const { type, name, template, conditions, id, position: _position = 'after' } = sideEffect
    if (_position !== position) {
      return
    }
    const meetsConditions = conditionIsMet({ conditions, payload: toolbox.payload })

    if (!meetsConditions) {
      return null
    }

    switch (type) {
      case 'payload':
        break
      default:
        return
    }

    if (template !== null && template !== undefined) {
      toolbox.payload[name] = ejs.render(template, toolbox.payload)
      let _question = null
      let _i = -1
      for (var i in questions) {
        if (questions[i].name === name) {
          _question = questions[i]
          _i = i
          break
        }
      }

      if (_question) {
        _question.value = toolbox.payload[name]
        questions[_i] = _question
        toolbox.print.log(`${chalk.green(`✓ (SE) ${position}`)} ${chalk.italic.bold(_question.message ? _question.message : _question.name)} ${chalk.italic(_question.value)}`)
      } else {
        toolbox.print.log(`${chalk.green(`✓ (SE) ${position}`)} ${chalk.italic.bold(name)} ${chalk.italic(toolbox.payload[name])}`)
      }

      return
    }
  }))
}

export default ({ toolbox }) => {

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

          const meetsConditions = conditionIsMet({ conditions: fullQuestion.conditions, payload: toolbox.payload })
          if (!meetsConditions) {
            return null
          }

          const items = toolbox.options.filter(a => a.name === question.name)
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

          if (fullQuestion.transformers
            && fullQuestion.transformers.in
            && fullQuestion.transformers.in.length) {
            await Bluebird.Promise.mapSeries(
              fullQuestion.transformers.in,
              async transformerRaw => {
                const transformer = toolbox.asks.transformers.in[transformerRaw.id]
                if (!transformer) {
                  return
                }
                fullQuestion = await transformer.handler({
                  item: transformerRaw,
                  question: fullQuestion,
                  payload: toolbox.payload,
                  toolbox,
                  promptModule,
                  promptType
                })
              })
          }

          await handleSideEffects({ questions, question: fullQuestion, toolbox, position: 'before' })

          fullQuestion.value = await ask({
            question: fullQuestion,
            payload: toolbox.payload,
            toolbox,
            promptModule,
            promptType,
            validatorsRunners: toolbox.asks.validators
          })

          let modified
          if (fullQuestion.transformers
            && fullQuestion.transformers.out
            && fullQuestion.transformers.out.length) {
            await Bluebird.Promise.mapSeries(
              fullQuestion.transformers.out,
              async transformerRaw => {
                const { template } = transformerRaw
                if (template) {
                  fullQuestion.value = ejs.render(template, {
                    ...toolbox.payload,
                    value: fullQuestion.value,
                  })
                  modified = true
                  return
                }

                const transformer = toolbox.asks.transformers.out[transformerRaw.id]
                if (!transformer) {
                  return
                }
                fullQuestion.value = await transformer.handler({
                  value: fullQuestion.value,
                  question: fullQuestion,
                  payload: toolbox.payload,
                  toolbox,
                  promptModule,
                  promptType
                })
                modified = true
              })
          }

          if (modified) {
            toolbox.print.log(`${chalk.green('✓')} ${chalk.italic.bold(fullQuestion.message ? fullQuestion.message : fullQuestion.name)} ${chalk.italic(fullQuestion.value)}`)
          }
          toolbox.payload[fullQuestion.name] = fullQuestion.value
          result[fullQuestion.name] = fullQuestion.value

          await handleSideEffects({ questions, question: fullQuestion, toolbox, position: 'after' })

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

