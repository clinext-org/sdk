import ejs from 'ejs'

export default ({ toolbox }) => {
  return {
    render: (text, data) => {
      return ejs.render(text, data)
    },
  }
}

