import path from 'path'
import {MongoClient} from 'mongodb'

export default MongoClient.connect(
  process.env.MONGO_URL 
  || 'mongodb://localhost:27017/'+path.basename(path.resolve('')),
  {native_parser: true}
)

/**
 * By default, the database name will be based on the app folder name
 * Then in the imported file use async function
 * e.g.
 * import connection from './mongo.js'
 * ;(async function(){
 *   let db = await connection
 *   db.collection('someCollection').find().toArray(...) 
 * })()
 * 
 */


