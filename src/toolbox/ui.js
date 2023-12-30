import chalk from "chalk"

export default ({ toolbox }) => {
  return {
    drawSectionHeader: ({ title, subTitle, type = 'text' }) => {
      switch (type) {
        case 'h1': {
          toolbox.print.log(`\n`)
          toolbox.print.log(chalk.white.bgRed.bold(`${title}`))
          if (subTitle) {
            toolbox.print.log(chalk.italic(`${subTitle}\n`))
          }
          toolbox.print.log(`----`)
          toolbox.print.log(``)
        } break
        case 'h2': {
          toolbox.print.log(`\n`)
          toolbox.print.log(chalk.white.bgGreen.bold(`${title}`))
          if (subTitle) {
            toolbox.print.log(chalk.italic(`${subTitle}\n`))
          }
        } break
        default: {
          toolbox.print.log(chalk.blue.bold(`\n${title}`))
          if (subTitle) {
            toolbox.print.log(chalk.italic(`${subTitle}\n`))
          }
        } break
      }


    },
  }
}

