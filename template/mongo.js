import path from 'path'
import {MongoClient} from 'mongodb'

export default MongoClient.connect(
  process.env.MONGO_URL 
  || 'mongodb://localhost:27017/app',
  {native_parser: true}
)

/**
 * By default, the database name is app
 * Use async function to retrive the connection 
 * e.g.
 * import connection from './mongo.js'
 * ;(async function(){
 *   let db = await connection
 *   db.collection('someCollection').find().toArray(...) 
 * })()
 * 
 */