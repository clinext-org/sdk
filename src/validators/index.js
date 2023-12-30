import nonEmpty from "./nonempty.js"

export default async a => {
  switch (a.id.toLowerCase()) {
    default: {
      return null
    }
    case 'nonempty': {
      return nonEmpty
    }
  }
}
