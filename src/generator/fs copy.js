import jetpack from 'fs-jetpack'
import fs from 'fs'
import getFileCallerURL from '../lib/getFileCallerURL.js'
import _path from 'path'
// import memfseditor from 'mem-fs-editor'
import Glob from 'glob'


export default ({ generator }) => {

  return {
    copyFull: async ({
      source,
      destination,
      data,
      options = { mark: true },
      useRelativeCall = true }) => {
      // const jsfiles = await Glob.glob(source, { ignore: 'node_modules/**' })



      // const g = new Glob(source, {})


      let rootSource = source
      let _source = source
      if (useRelativeCall) {
        let sou = getFileCallerURL()
        sou = _path.dirname(sou)
        sou = sou.replace('file://', '')
        rootSource = `${sou}/template`
        _source = `${sou}/template/${_source}`
      }

      return new Promise((resolve, reject) => {
        const mg = new Glob(_source, options, async (er, matches) => {
          await Promise.all(matches.map(async match => {
            // if (await checkFileExists(destination)) {
            //   return
            // }
            // const ffs = memfseditor.create()
            const _destination = match.replace(rootSource, destination)
            const re = await jetpack.copyAsync(match, _destination, { overwrite: true })
            return re
            // return fs.promises.copyFile(_source, destination)
          }))
        })
      })
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

