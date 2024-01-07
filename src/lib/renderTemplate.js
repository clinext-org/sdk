import ejs from 'ejs'


export default async ({ template, data = CliNext.payload }) => {

  let content = template.replace(/\<{\{(.*?)\}\}>/g, function (match, token) {
    let parts = token.split('|')
    parts = parts.map(i => {
      if (!i) {
        return ""
      }
      return i.trim()
    })

    const key = parts[0]
    const defaultValue = parts[1]
    if (CliNext.payload[key] !== undefined) {
      return `<%= ${key} %>`
    }
    return `${defaultValue}`
  })

  const result = await ejs.render(content, data, {
    async: true,
    strict: false
  })

  return result

}
