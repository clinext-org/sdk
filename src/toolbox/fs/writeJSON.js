
export default async (props) => {
  const {
    text,
    toolbox
  } = props
  return toolbox.fs.writeText({
    ...props,
    format: 'utf8',
    text: JSON.stringify(text, null, 2)
  })
}
