const { getAllLaunches, addNewLaunch, existsLaunchWithId, abortLaunchById, scheduleNewLaunch } = require('../../models/launches.model') 
const getPagination = require('../../services/query')


// Get All Launches
async function httpGetAllLaunches(req, res) {
  const { skip, limit } = getPagination(req.query)
  const launches = await getAllLaunches(skip, limit)
    return res.status(200).json(launches)
}

// Add New Launch
async function httpAddNewLaunch(req, res) {
  const launch = req.body
  console.log(launch);

  if (!launch.mission || !launch.rocket || !launch.launchDate || !launch.target) {
    return res.status(400).json({
      error : 'Missing required launch property'
    })
  }

  launch.launchDate = new Date(launch.launchDate);

  if (launch.launchDate.toString() === 'Invalid Date') {
    return res.status(400).json({
      error: 'Invalid Date'
    });
  }
  
  await scheduleNewLaunch(launch);
  return res.status(201).json(launch)
}

// Abort Launches
async function httpAbortLaunch(req, res) {
  const launchId = Number(req.params.id)

  const existsLaunch = await existsLaunchWithId(launchId)
  // If launch doesn't exist 
  if (!existsLaunch) {
    return res.status(404).json({
      error: 'Launch Not Found'
    })
  }

  const aborted = await abortLaunchById(launchId)

  if (!aborted) {
    res.status(400).json({
      error: 'Launch Not Aborted!'
    })
  }

  return res.status(200).json({
    acknowledged : true
  })
}

module.exports = {
  httpGetAllLaunches,
  httpAddNewLaunch,
  httpAbortLaunch,
}