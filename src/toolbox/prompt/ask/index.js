import doAsk from './doAsk.js'
import Bluebird from "bluebird"
import _promptModule from '../promptModule.js'

import ejs from 'ejs'
import chalk from 'chalk'
import conditionIsMet from './conditionIsMet.js'
import handleSideEffects from './handleSideEffects.js'


export default async ({ toolbox, value }) => {

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

      fullQuestion.value = await doAsk({
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

}

