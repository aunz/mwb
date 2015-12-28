import Datastore from 'nedb'
const db = new Datastore()

db.insert({id:1, author: 'cat', content: 'I like to sleep all day!'})
db.insert({id:2, author: 'dog', content: 'Where are the sheeps?'})
db.insert({id:3, author: 'mouse', content: 'Why do humans think we like cheese, they stink!'})

export default db