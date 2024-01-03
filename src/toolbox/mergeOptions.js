
import _ from 'underscore'
import lodash from 'lodash'

export default async ({ handlerOptions = [], toolbox }) => {

  toolbox.options = handlerOptions.map(option => {
    switch (option.scope) {
      case 'private': {
        return option
      }
      default: break
    }

    const i = _.findWhere(toolbox.libraryOptions,
      { name: option.name })

    if (!i) {
      return option
    }

    let result = { ...option }
    const a = lodash.merge(
      i,
      result,
    )
    return a
  })

  await Promise.all(toolbox.options.filter(a => a.loadFromStoreOnInit).map(async option => {
    let storedValue = await toolbox.store.get({
      key: option.name,
      domain: 'domain'
    })
    toolbox.payload[option.name] = storedValue
  }))
}
