
import ejs from 'ejs'
import chalk from 'chalk'
import conditionIsMet from './conditionIsMet.js'

export default async ({ toolbox, questions, question, position = 'after' }) => {

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
