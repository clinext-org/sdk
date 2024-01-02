import * as dotenv from 'dotenv';
import fs from 'fs';
import _path from 'path';
dotenv.config()

export default async (props) => {
  const {
    projectSrcPath,
    toolbox,
  } = props


  const env = process.env.NODE_ENV || 'production'
  const localEnv = await loadEnv({ env, projectSrcPath })
  toolbox.env = localEnv
}

const loadEnv = async ({ env, projectSrcPath }) => {
  const f = env === 'development' ? '../.env.development' : '../.env'
  const __d = _path.resolve(projectSrcPath, f)
  let content = null
  if (fs.existsSync(__d)) {
    content = (await fs.promises.readFile(__d)).toString()
  }
  const parsed = dotenv.parse(content)

  return parsed
}
