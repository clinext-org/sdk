
import Bluebird from "bluebird"
import chalk from "chalk"

export default async (props) => {
  const {
    payload,
    question,
    generator,
    promptModule,
    validators = [],
    promptType } = props

  let {
    name,
    message,
    defaultValue,
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
    generator.print.log(`${chalk.green('✓')} ${chalk.bold(message ? message : name)} ${chalk.italic(value)}`)
    return value
  }

  const isQuick = payload['quick'] || payload['q']
  if (isQuick && valueIsDefined) {
    generator.print.log(`${chalk.green('✓')} ${chalk.bold(message ? message : name)} ${chalk.italic(value)}`)
    return value
  }

  if (isQuick && !(defaultValue === null || defaultValue === undefined)) {
    payload[name] = defaultValue
    generator.print.log(`${chalk.green('✓')} ${chalk.bold(message ? message : name)} ${chalk.italic(payload[name])}`)
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
        async validator => {


          if (validator.runner) {
            const _i = await validator.runner({ input, ...validator })
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
          }
        })
      if (props.question.validate) {
        isValid = props.question.validate(input)
        errorMessage = "Validation failed"
      }
      if (!isValid) {
        generator.print.log(`    ${chalk.red('✋')} ${chalk.red.bold(errorMessage)}`)
      }
      return isValid
    }
  }))[name]

  return result
}
