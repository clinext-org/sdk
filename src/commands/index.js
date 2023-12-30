import buildDir from './build/index.js'

export default async ({ path, yargs, options, toolbox, payload }) => {

  const commandsPath = `${path}/commands`


  const { index, commands } = await buildDir({ path: commandsPath, toolbox, yargs, root: true, payload })
  commands.forEach(command => {
    yargs.command(command)
  })

  yargs.argv
  return commands
}
