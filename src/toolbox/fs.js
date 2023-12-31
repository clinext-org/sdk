import jetpack from 'fs-jetpack'
import fs from 'fs'
import getFileCallerURL from '../lib/getFileCallerURL.js'
import _path from 'path'
import fg from 'fast-glob'
import isGlob from 'is-glob'
import ejs from 'ejs'
import Bluebird from "bluebird"
import ensureDirectoryExists from '../lib/ensureDirectoryExists.js'


export default ({ toolbox }) => {

  return {
    chunks: {
      copy: async ({
        source,
        destination,
        data,
        options = { mark: true },
      }) => {
        let rootSource = source
        let _source = source

        let sou = getFileCallerURL()
        sou = _path.dirname(sou)
        sou = sou.replace('file://', '')
        rootSource = `${sou}/template`
        _source = `${sou}/template/${_source}`

        const _isGlob = isGlob(source)
        const entries = await fg([_source], options,)

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

            try {
              const content = await fs.promises.readFile(entry, 'utf8')
              const result = ejs.render(content, data)
              return fs.promises.writeFile(_destination, result)
            } catch (e) {
              return copyFile()
            }
            // }))
          })
      },
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

