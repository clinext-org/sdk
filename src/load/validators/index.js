
export default async ({ path, }) => {

  const indexPath = `${path}/questions/validators/index.js`
  const run = (await import(`${indexPath}`)).default
  return run
}
