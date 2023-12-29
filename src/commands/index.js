import buildDir from './build/index.js'

export default async ({ path, yargs, options, generator, payload }) => {

  const commandsPath = `${path}/commands`


  const { index, commands } = await buildDir({ path: commandsPath, generator, yargs, root: true, payload })
  commands.forEach(command => {
    yargs.command(command)
  })

  yargs.argv
  return commands
}
