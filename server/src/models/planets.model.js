const { parse } = require('csv-parse')
const fs = require('fs')
const path = require('path')
// In Node all stream using Event Emitter 
const planets = require('./planets.mongo')


function isHabitablePlanet(planet) {
  return planet['koi_disposition'] === 'CONFIRMED'
    && planet['koi_insol'] > 0.36 && planet['koi_insol'] < 1.11
    && planet['koi_prad'] < 1.6
}

function loadPlanetsData() {
  return new Promise((resolve, reject) => {
      fs.createReadStream(path.join(__dirname, '..', '..', 'data', 'kepler_data.csv'))
      .pipe(parse({
        comment: '#',
        columns: true
      }))
      // Pipe connect 2 stream together 
      // Pipe mean to connect to a Readable Stream source to a Wridable Destination
      .on('data', async (data) => {
        if (isHabitablePlanet(data)) {
          savePlanet(data)
        }
      })
      .on('error', error => {
        console.log(error);
        reject(error)
      })
      .on('end', async () => {
        const countPlanetsFound = (await getAllPlanets())
        console.log(`${countPlanetsFound.length} habitable planets found!`)
       resolve()
    })
  })
  
}

// get all Planets function 
async function getAllPlanets() {
  return await planets.find({},{
    '_id': 0, '__v': 0,
  })
}

// Update planets function 
async function savePlanet(planet) {
  try {
    // Replace below create with insert + update = upsert
    await planets.updateOne({
      keplerName: planet.kepler_name,
    }, {
      keplerName: planet.kepler_name,
    }, {
      upsert: true,
    });
  } catch (error) {
    console.error(`Could not save planet ${error}`)
  }
}

module.exports = {
    loadPlanetsData,
    getAllPlanets
  }