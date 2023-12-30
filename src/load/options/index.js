import directoryFilesRecursive from '../../lib/directoryFilesRecursive.js'

export default async ({ path, config, }) => {
  const optionsPath = `${path}/questions/options`
  let files = await directoryFilesRecursive({
    path: optionsPath,
    includeMeta: false
  })
  files = files ? files.map(f => f.default) : []
  return files
}
