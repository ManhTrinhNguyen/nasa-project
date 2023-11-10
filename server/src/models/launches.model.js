const axios = require('axios')

const launchesDatabase = require('./launches.mongo')
const planets = require('./planets.mongo')

const DEFAULT_FLIGHT_NUMBER = 100 

// const launch = {
//   flightNumber: 100, // flight_number
//   mission: 'Kepler Exploration X', // name
//   rocket: 'Explorer IS1', // rocket.name
//   launchDate: new Date('Dec 27, 2030'), // date_local
//   target: 'Kepler-442 b', // not applicaple
//   customer: ['NASA', 'ZTM'], // payload.customers for each payload 
//   upcoming: true, // upcoming 
//   success: true, // success
// };

const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query'

async function populateLaunches() {
  console.log('Loading Launches Data...');
  const response = await axios.post(SPACEX_API_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: 'rocket',
          select: {
            name: 1
          }
        },
        {
          path: 'payloads',
          select: {
            'customers': 1
          }
        }
      ]
    }
  });

  if (response.status !== 200) {
    console.log('Problem downloading launch data');
    throw new Error('Launch data download failed')
  }
  
  
  const launchDocs = response.data.docs 

  for (const launchDoc of launchDocs) {
    const payloads = launchDoc['payloads']
    const customers = payloads.flatMap(payload => {
      return payload['customers'];
    })

    const launch = {
      flightNumber: launchDoc['flight_number'],
      mission: launchDoc['name'], 
      rocket: launchDoc['rocket']['name'],
      launchDate: launchDoc['date_local'],
      upcoming: launchDoc['upcoming'],
      success: launchDoc['success'],
      customers
    }
    
    //console.log(`${launch.flightNumber} ${launch.mission}`);
    await saveLaunch(launch)
  }
}

// Load launches Data from SpaceX api
async function loadLaunchData() {
  const firstLaunch = await findLaunch({
    flightNumber: 1,
    rocket: 'Falcon 1',
    mission: 'FalconSat'
  });

  if (!firstLaunch) {
    console.log('Launch data already loaded');
  } else {
    await populateLaunches()
   }

}

// Create findLaunch function to remove duplicate of find Launch 
async function findLaunch(filter) {
  return await launchesDatabase.find(filter)
}

// Get All Launches
async function getAllLaunches(skip, limit) {
  return await launchesDatabase
    .find({}, { '_id': 0, '__v': 0 })
    .sort({flightNumber: 1})
    .skip(skip)
    .limit(limit)
}

// Save Launch Function 
async function saveLaunch(launch) {
  // Update Launch 
  await launchesDatabase.findOneAndUpdate({
    flightNumber: launch.flightNumber
  }, launch, {
    upsert: true
  })
}

// Add New Launch 

// function addNewLaunch(launch) {
//   latestFlightNumber++
//   launches.set(latestFlightNumber, Object.assign(launch, {
//     success: true,
//     upcoming: true,
//     customer: ['Zero to Mastery', 'NASA'],
//     flightNumber: latestFlightNumber
//   }))
// }

// Schedule new Launch 
async function scheduleNewLaunch(launch) {
  // Find Planet 
  const planet = await planets.findOne({
    keplerName: launch.target
   });
 
   // Check if Planet found
   if (!planet) {
     throw new Error('No matching planet found!')
  } 
  
  const newFlightNumber = await getLatestFlightNumber() + 1

  // Assign new Launch 
  const newLaunch = Object.assign(launch, {
    success: true,
    upcoming: true,
    customer: ['Zero to Mastery', 'NASA'],
    flightNumber: newFlightNumber
  });

  await saveLaunch(newLaunch)
}

// Get latest Flight Number 
async function getLatestFlightNumber() {
   // get Latest launch
   const latestLaunch = await launchesDatabase
     .findOne({})
     .sort('-flightNumber');
  
  // check if there is latestLaunch 
  if (!latestLaunch) {
    return DEFAULT_FLIGHT_NUMBER
  }
   
   return latestLaunch.flightNumber
}

// Exist Launch With Id
async function existsLaunchWithId(launchId) {
  return await findLaunch({
    flightNumber: launchId
  })
}
// Abort Launch By Id
async function abortLaunchById(launchId) {

 const aborted = await launchesDatabase.updateOne({
    flightNumber: launchId,
  }, {
    upcoming: false,
    success: false,
  });

  return aborted.acknowledged
}
 
module.exports = {
  loadLaunchData,
  getAllLaunches,
  existsLaunchWithId,
  abortLaunchById,
  scheduleNewLaunch,
}


