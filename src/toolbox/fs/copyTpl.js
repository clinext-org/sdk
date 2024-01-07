import fs from 'fs'
import ejs from 'ejs'

export default async (source, destination, data) => {
  const entry = await fs.promises.readFile(source)
  const result = ejs.render(entry, data)
  await fs.promises.writeFile(destination, result)
}
