import jetpack from 'fs-jetpack'
import fs from 'fs'

export default async ({ path, }) => {

  const transformersPath = `${path}/questions/transformers`
  const candidates = await jetpack.listAsync(transformersPath)
  if (!candidates || !candidates.length) {
    return
  }

  const items = await Promise.all(candidates.map(async item => {
    const __path = `${transformersPath}/${item}`
    const stat = await fs.promises.stat(__path)
    if (!stat || !stat.isDirectory()) {
      return null
    }

    let index = await fs.promises.readFile(`${__path}/index.json`, 'utf-8')
    index = JSON.parse(index)
    const run = (await import(`${__path}/index.js`)).default
    return { index, run }
  }))

  return items

}
