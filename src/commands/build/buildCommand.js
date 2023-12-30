
export default async ({
  path,
  toolbox,
  payload,
  fileName }) => {
  const data = (await import(path)).default
  const { name = '',
    description = '',
    // options = {},
    handler,
    example } = data

  const command = {
    command: name,
    desc: description,
    builder: {},
    handler: (argv,) => {
      data.handler({ toolbox, payload, argv })
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
