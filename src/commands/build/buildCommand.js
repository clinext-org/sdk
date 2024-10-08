
export default async ({
  path,
  toolbox,
}) => {
  const data = (await import(path)).default
  const {
    name = '',
    description = '',
  } = data

  const command = {
    command: name,
    desc: description,
    builder: {},
    handler: async (argv,) => {
      toolbox.ui.drawSectionHeader({
        title: '---------------',
      })
      if (!data.skipTitleDisplay) {
        toolbox.ui.drawSectionHeader({
          type: 'h1',
          title: name,
          subTitle: description,
        })
      }
      if (data.handler) {
        try {
          let result = await data.handler({ toolbox })
          if (!result) {
            result = {}
          }

          const {
            message = "Done",
            success = false
          } = result

          toolbox.ui.drawSectionHeader({
            type: 'h1',
            title: message,
            accent: success ? 'main' : 'error'
          })

        } catch (e) {
          console.error(e)
        }

        // console.log(result)
        process.exit(0)
      }
    }
  }

  return {
    command,
    data: {
      ...data,
      options: (data.options && data.options.length) ? data.options : []
    }
  }
}
