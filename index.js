const m = require('easy-pdf-merge')
const fs = require('fs')
const path = require('path')
const util = require('util')
let paramName;

const { readdir, access, stat } = fs.promises

const params = process.argv.reduce( (params, arg) => {
  if (paramName) {
    params[paramName] = arg
    paramName = null
  } else {
    switch(arg) {
      case '-p':
      case '--path':
        paramName = 'input'
        break;
      case '-f':
      case '--files':
        paramName = 'files'
        break;
      case '-of':
      case '--output-folder':
        paramName = 'outputFolder'
        break;
      case '-o':
      case '--output-file':
        paramName = 'outputFile'
        break;
    }
  }
  return params
}, {})

const run = async () => {
  try {
    let fileList = []
    let _outputFile

    const { input, files, outputFile = 'merge.pdf', outputFolder='./' } = params
    if (input) {
      fileList = await readdir(input)
    }

    if (files) {
      fileList = Promise.all( params.files.map( fileName => fs.normalize(fileName) ))
    }

    const isAbsolute  = path.isAbsolute(outputFile)
    if (isAbsolute) {
      _outputFile = outputFile
    } else {
      const { isDirectory, exists } = await stat(outputFolder)
      if (isDirectory) {
        if (exists) {
          throw new Error(`output folder doesn't exist`)
        } else {
          const file = outputFile
          _outputFile = path.join(outputFolder, file)
        }
      } else {
        throw new Error('output folder is not a directory')
      }
    }

     fileList = (await Promise.all(fileList.map( async name => {
      try {
        const absPath = path.join(input, name)
        const statistic = await stat(absPath)
        return [statistic.isFile() && path.extname(name) === '.pdf', absPath]
      } catch( e ) {

      }
    })))
       .filter( ([exist]) => exist)
       .map(([, name]) => name)

    if (fileList.length > 0) {
      try {
        await util.promisify(m)(fileList, _outputFile)
        console.info(`${fileList.length} merged into ${_outputFile}`)
      } catch (e) {
        throw new Error(e.message)
      }

    } else {
      throw new Error('No PDF files for merge')
    }

  } catch (e) {
    console.error(`ERROR:> ${e.message}`)
  }
}

run()
