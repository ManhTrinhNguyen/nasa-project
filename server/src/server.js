const http = require('http');



const app = require('./app')

const { mongoConnect } = require('./services/mongo')

const { loadPlanetsData } = require('./models/planets.model')

const { loadLaunchData } = require("./models/launches.model")


const PORT = process.env.PORT || 8000

const server = http.createServer(app)


async function startServer() {
  // Connect mongoose to the DB
  await mongoConnect()

  await loadPlanetsData()

  await loadLaunchData()

  server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  })
}

startServer()

/**
 * Node Sever normally take in the request and proccess them in the request loop send back the response to the browser . It all happend in 1 thread
 * Single Thread : mean run 1 line of code at the time  
 * Even Loop : good at juggling mutiple request as the come in and passing off hard work so the server doesn't block
 * 
 * MORE Details :
 * 
 */

// Database user access password : oB7kloQSc67laswp




