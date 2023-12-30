
export default async ({ input, params }) => {
  return {
    isValid: (input && input.length > 0),
    message: 'Not a number'
  }
}
