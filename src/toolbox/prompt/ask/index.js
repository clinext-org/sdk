import doAsk from './doAsk.js'
import Bluebird from "bluebird"
import _promptModule from '../promptModule.js'

import ejs from 'ejs'
import chalk from 'chalk'
import conditionIsMet from './conditionIsMet.js'
import handleSideEffects from './handleSideEffects.js'
import valueExists from './valueExists.js'


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
      const {
        promptType = 'input',
        promptModule = _promptModule(),
        storeDomain = "domain",
        loadFromStoreOnInit = true,
        loadFromStore = true,
        storeValue = false,
        storeSecurely = false,
        useStoreValueAsDefault = true
      } = fullQuestion

      if (typeof promptModule === 'string') {
        promptModule = _promptModule(fullQuestion.promptModule)
      }

      if (fullQuestion.transformers
        && fullQuestion.transformers.in
        && fullQuestion.transformers.in.length) {
        await Bluebird.Promise.mapSeries(
          fullQuestion.transformers.in,
          async _transformerRaw => {
            const transformerRaw = (typeof _transformerRaw === "string") ? {
              id: _transformerRaw
            } : _transformerRaw


            let handler = transformerRaw.handler
            if (!handler) {
              const transformer = toolbox.asks.transformers.in[transformerRaw.id]
              if (!transformer) {
                return
              }
              handler = transformer.handler
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

      const _doAsk = async () => {
        fullQuestion.value = await doAsk({
          question: fullQuestion,
          payload: toolbox.payload,
          toolbox,
          promptModule,
          promptType,
          validatorsRunners: toolbox.asks.validators,
          displayTransformersRunners: toolbox.asks.transformers.display,
        })
      }


      if (!valueExists(fullQuestion.value) && loadFromStore) {
        let storedValue = await toolbox.store.get({
          key: fullQuestion.name,
          domain: storeDomain
        })
        if (valueExists(storedValue)) {
          if (useStoreValueAsDefault) {
            fullQuestion.defaultValue = storedValue
            await _doAsk()
          } else {
            fullQuestion.value = storedValue
            toolbox.print.log(`${chalk.green(`✓ (stored value)`)} ${chalk.italic.bold(fullQuestion.message)} ${chalk.italic(fullQuestion.value)}`)
          }
        }
        else {
          await _doAsk()
        }
      } else {
        await _doAsk()
      }

      let modified
      if (fullQuestion.transformers
        && fullQuestion.transformers.out
        && fullQuestion.transformers.out.length) {
        await Bluebird.Promise.mapSeries(
          fullQuestion.transformers.out,
          async _transformerRaw => {
            const transformerRaw = (typeof _transformerRaw === "string") ? {
              id: _transformerRaw
            } : _transformerRaw

            const { template } = transformerRaw
            if (template) {
              fullQuestion.value = ejs.render(template, {
                ...toolbox.payload,
                input: fullQuestion.value,
              })
              modified = true
              return
            }

            let handler = transformerRaw.handler
            if (!handler) {
              const transformer = toolbox.asks.transformers.out[transformerRaw.id]
              if (!transformer) {
                return
              }
              handler = transformer.handler
            }

            fullQuestion.value = await handler({
              input: fullQuestion.value,
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

      if (storeValue) {
        await toolbox.store.save({
          key: fullQuestion.name,
          domain: storeDomain,
          value: fullQuestion.value,
          secure: storeSecurely
        })
      }
      return fullQuestion.value
    })
  return result

}

