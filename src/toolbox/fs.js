import jetpack from 'fs-jetpack'
import fs from 'fs'
import getFileCallerURL from '../lib/getFileCallerURL.js'
import _path from 'path'
import ejs from 'ejs'
import ensureDirectoryExists from '../lib/ensureDirectoryExists.js'


export default ({ toolbox }) => {

  return {
    writeText: async ({
      text,
      destination,
      data,
      options = { mark: true },
    }) => {

      await ensureDirectoryExists(destination)
      const copyFile = async () => {
        try {
          return fs.promises.writeFile(destination, text)
        } catch (e) {
          console.error(e)
        }
      }
      if (!data) {
        return copyFile()
      }

      try {
        const result = ejs.render(text, data)
        return fs.promises.writeFile(destination, result)
      } catch (e) {
        return copyFile()
      }
    },
    copy: async ({ source, destination, useRelativeCall = false }) => {
      return fs.promises.cp(source, destination)
    },
    copyTpl: async (source, destination, data) => {
      const entry = await fs.promises.readFile(source)
      const result = ejs.render(entry, data)
      await fs.promises.writeFile(destination, result)
    },
    copyFraction: async ({ source, destination, data, useRelativeCall = true }) => {
      let _source = source
      if (useRelativeCall) {
        let sou = getFileCallerURL()
        sou = _path.dirname(sou)
        sou = sou.replace('file://', '')
        _source = `${sou}/template/${_source}`
      }

      // if (await checkFileExists(destination)) {
      //   return
      // }
      // const ffs = memfseditor.create()
      const re = await jetpack.copyAsync(_source, destination, { overwrite: true })
      return re
      // return fs.promises.copyFile(_source, destination)
    },

  }
}

