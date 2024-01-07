
import writeText from './writeText.js'
import copyWithRootSource from './copyWithRootSource.js'
import writeJSON from './writeJSON.js'
import copy from './copy.js'
import copyTpl from './copyTpl.js'

export default ({ toolbox }) => ({
  writeText,
  copy,
  copyTpl,
  copyWithRootSource: async ({
    source,
    destination = toolbox.payload.destination,
    data = toolbox.payload,
    globOptions = { mark: true },
    render = true,
    rootSource
  }) =>
    copyWithRootSource({
      source,
      destination,
      data,
      globOptions,
      render,
      rootSource
    })
  ,
  writeJSON: async (props) => writeJSON({ ...props, toolbox })
})
