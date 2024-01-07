import fs from 'fs'

export default async ({ source, destination, }) => {
  return fs.promises.cp(source, destination)
}
