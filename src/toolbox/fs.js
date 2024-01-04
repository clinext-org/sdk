import jetpack from 'fs-jetpack'
import fs from 'fs'
import fg from 'fast-glob'
import isGlob from 'is-glob'
import ejs from 'ejs'
import Bluebird from "bluebird"
import ensureDirectoryExists from '../lib/ensureDirectoryExists.js'

export default ({ toolbox }) => {
  return {
    writeText: async ({
      text,
      destination,
      data,
      render = true
    }) => {

      await ensureDirectoryExists(destination)
      const copyFile = async () => {
        try {
          return fs.promises.writeFile(destination, text)
        } catch (e) {
          console.error(e)
        }
        return false
      }
      if (!data) {
        return copyFile()
      }

      if (render) {
        try {
          const result = ejs.render(text, data)
          return fs.promises.writeFile(destination, result)
        } catch (e) {
          return copyFile()
        }
      }
      else {
        return copyFile()
      }

    },
    copy: async ({ source, destination, }) => {
      return fs.promises.cp(source, destination)
    },
    copyTpl: async (source, destination, data) => {
      const entry = await fs.promises.readFile(source)
      const result = ejs.render(entry, data)
      await fs.promises.writeFile(destination, result)
    },
    copyAdvanced: async ({
      source,
      destination = toolbox.payload.destination,
      data = toolbox.payload,
      globOptions = { mark: true },
      render = true,
      rootSource
    }) => {

      const _isGlob = isGlob(source)
      const entries = await fg([source], globOptions,)

      await Bluebird.Promise.mapSeries(
        entries,
        async entry => {
          // await Promise.all(entries.map(async entry => {
          let _destination = _isGlob
            ? entry.replace(rootSource, destination)
            : destination

          _destination = _destination.replace("{.}", ".")
          await ensureDirectoryExists(_destination)
          const copyFile = async () => {
            try {
              return jetpack.copyAsync(entry, _destination, { overwrite: true })
            } catch (e) {
              console.error(e)
            }
          }
          if (!data) {
            return copyFile()
          }

          if (!render) {
            return copyFile()
          }
          else {
            try {
              const content = await fs.promises.readFile(entry, 'utf8')
              const result = ejs.render(content, data)
              return fs.promises.writeFile(_destination, result)
            } catch (e) {
              console.info(`Could not write file ${entry}`, e)
              return copyFile()
            }
          }

          // }))
        })
    }
  }
}

