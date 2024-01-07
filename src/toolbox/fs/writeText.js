import fs from 'fs'
import ensureDirectoryExists from '../../lib/ensureDirectoryExists.js'

export default async ({
  text,
  destination,
  data,
  render = true,
  format = 'utf8' }) => {

  await ensureDirectoryExists(destination)
  if (!data || !render) {
    return doCopyFile({ text, destination })
  }

  try {
    const result = await CliNext.template.render({ template: text, data })
    return fs.promises.writeFile(destination, result, format)
  } catch (e) {
    return doCopyFile({ entry, destination })
  }
}

const doCopyFile = async ({ text, destination }) => {
  try {
    return fs.promises.writeFile(destination, text, format)
  } catch (e) {
    console.error(e)
  }
  return false
}
