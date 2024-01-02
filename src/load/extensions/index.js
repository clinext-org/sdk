import jetpack from 'fs-jetpack'


export default async ({ path, toolbox }) => {
  const candidates = await jetpack.listAsync(path)
  if (!candidates || !candidates.length) {
    return
  }

  await Promise.all(candidates.map(async item => {
    const __path = `${path}/${item}/index.js`

    const { id, description, register } = (await import(__path)).default
    if (!id || !register) {
      return
    }
    await register({ toolbox })
  }))
}
