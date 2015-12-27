export default (type, ...argNames) => (...args) => {
  let action = { type }
  argNames.forEach((arg, index) => {
    action.payload = {
    	[argNames[index]] : args[index]
    }
  })
  return action
}
