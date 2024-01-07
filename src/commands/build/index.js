import jetpack from 'fs-jetpack'
import fs from 'fs'
import buildCommand from './buildCommand.js'
import formatOptionForYargs from './formatOptionForYargs.js'

const operation = async ({ path, toolbox, yargs, root = false, payload }) => {
  const candidates = await jetpack.listAsync(path)
  if (!candidates || !candidates.length) {
    return
  }

  const commands = []
  let index = null

  let subCommands = []

  await Promise.all(candidates.map(async item => {
    const __path = `${path}/${item}`
    const stat = await fs.promises.stat(__path)
    if (!stat || !stat.isDirectory()) {
      return null
    }

    const subCommand = await operation({ path: __path, toolbox, payload, yargs })
    subCommands.push(subCommand)
  }))

  // subCommands.sort((a, b) => a.index.position < b.index.position)

  await Promise.all(candidates.map(async item => {
    const __path = `${path}/${item}`
    const stat = await fs.promises.stat(__path)
    if (!stat || stat.isDirectory()) {
      return null
    }

    const { data: commandData, command } = await buildCommand({ path: __path, toolbox, fileName: item, payload })

    if (item === 'index.js') {
      return
    }

    command.builder = async yargs => {
      await fixOptions({ toolbox, commandOptions: commandData.options, yargs })
      if (commandData.example) {
        yargs.example(commandData.example)
      }
    }
    if (commandData.usage) {
    }
    command._raw = commandData
    commands.push(command)
  }))

  // commands.sort((a, b) => a._raw.position < b._raw.position)

  await Promise.all(candidates.map(async item => {
    const __path = `${path}/${item}`
    const stat = await fs.promises.stat(__path)
    if (!stat || stat.isDirectory()) {
      return null
    }

    if (item !== 'index.js') {
      return
    }

    const { data: commandData, command } = await buildCommand({ path: __path, toolbox, fileName: item, payload })

    if (!root) {
      command.builder = async yargs => {
        await fixOptions({ toolbox, commandOptions: commandData.options, yargs })
        // commandData.options.forEach(option => formatOptionForYargs({ option, yargs }))
        if (commandData.example) {
          yargs.example(commandData.example)
        }
        commands.forEach(subCommand => {
          yargs.command(subCommand)
        })
        subCommands.forEach(subCommand => {
          yargs.command(subCommand.index)
        })
      }
    }
    else {
      subCommands.forEach(subCommand => {
        if (subCommand.index) {
          yargs.command(subCommand.index)
        }
      })
    }


    index = command
  }))

  return { index, commands }
}

export default operation



import parseArgv from 'tiny-parse-argv'
const fixOptions = async ({ toolbox, commandOptions, yargs }) => {
  let nativeArgv = parseArgv(process.argv)
  delete nativeArgv["--"]
  delete nativeArgv["_"]
  Object.keys(nativeArgv).forEach(n => {
    toolbox.payload[n] = nativeArgv[n]
  })

  const _options = (commandOptions && commandOptions.length)
    ? commandOptions
    : []
  const options = _options.map(option => {
    const value = nativeArgv[option.name]
    return {
      ...option,
      value
    }
  })
  await toolbox.mergeOptions(options)
  toolbox.options.forEach(option => formatOptionForYargs({ option, yargs }))
}
