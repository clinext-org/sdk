


export default ({ conditions, payload }) => {
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
