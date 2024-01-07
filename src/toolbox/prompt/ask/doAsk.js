
import Bluebird from "bluebird"
import chalk from "chalk"

export default async (props) => {
  const {
    payload,
    question,
    toolbox,
    promptModule,
    displayTransformersRunners = {},
    validatorsRunners = [],
    promptType } = props

  let {
    name,
    message,
    defaultValue,
    validators = [],
    // transformers = { display: displayTransformers = [] },
    hideValidationErrorMessage = false
  } = question

  if (!name) {
    return null
  }

  let value = payload[name]
  if (!value && question.alias) {
    value = payload[question.alias]
  }
  const valueIsDefined = !(value === null || value === undefined)
  if (valueIsDefined) {
    toolbox.print.log(`${chalk.green('✓')} ${chalk.bold(message ? message : name)} ${chalk.italic(value)}`)
    return value
  }

  const isQuick = payload['quick'] || payload['q']
  if (isQuick && valueIsDefined) {
    toolbox.print.log(`${chalk.green('✓')} ${chalk.bold(message ? message : name)} ${chalk.italic(value)}`)
    return value
  }

  if (isQuick && !(defaultValue === null || defaultValue === undefined)) {
    payload[name] = defaultValue
    toolbox.print.log(`${chalk.green('✓')} ${chalk.bold(message ? message : name)} ${chalk.italic(payload[name])}`)
    return defaultValue
  }

  const result = (await promptModule.prompt({
    ...props.question,
    type: promptType,
    name,
    message,
    default: value ? value : defaultValue,
    validate: async input => {
      let isValid = true
      let errorMessage = null
      await Bluebird.Promise.mapSeries(
        validators,
        async _validator => {
          const validator = (typeof _validator === "string") ? {
            id: _validator
          } : _validator

          if (validator.id
            && validatorsRunners[validator.id.toLowerCase()]
            && validatorsRunners[validator.id.toLowerCase()].handler) {
            const _i = await validatorsRunners[validator.id.toLowerCase()].handler({ input, ...validator })
            if (_i && !_i.isValid) {
              isValid = false
              errorMessage = _i.message ? _i.message : validator.errorMessage
              errorMessage = errorMessage ? errorMessage : "Validation failed"
            }
            return
          }

          if (validator.regex) {
            const f = new RegExp(validator.regex, 'g')
            // isValid = validator.regex.test(input)
            isValid = f.test(input)
            if (!isValid) {
              errorMessage = validator.errorMessage ? validator.errorMessage : "Does not match regex"
            }
            return
          }

          if (validator.handler) {
            const _i = await validator.handler({ input, ...validator })
            if (_i && !_i.isValid) {
              isValid = false
              errorMessage = _i.message ? _i.message : validator.errorMessage
              errorMessage = errorMessage ? errorMessage : "Validation failed"
            }
            return
          }
        })
      if (props.question.validate) {
        isValid = props.question.validate(input)
        errorMessage = "Validation failed"
      }
      if (!isValid && !hideValidationErrorMessage) {
        toolbox.print.log(`    ${chalk.red('✋')} ${chalk.red.bold(errorMessage)}`)
      }
      return isValid
    },
    transformer: input => {
      let result = input
      if (props.question.transformer) {
        result = props.question.transformer(result)
      }
      else if (question.transformers && question.transformers.display && question.transformers.display.length) {
        question.transformers.display.forEach(_transformer => {
          const transformer = (typeof _transformer === "string") ? {
            id: _transformer
          } : _transformer

          if (transformer.id
            && displayTransformersRunners[transformer.id]
            && displayTransformersRunners[transformer.id].handler) {
            result = displayTransformersRunners[transformer.id].handler({ input: result, toolbox, })
          }

          else if (transformer.template) {
            result = ejs.render(transformer.template, {
              ...toolbox.payload,
            })
          }
          else if (transformer.handler) {
            result = transformer.handler({ input: result, toolbox })
          }
        })
      }
      return result
    }
  }))[name]

  return result
}
