'use strict'

class Workout {
  date = Date.now()
  id = (Date.now() + '').slice(-10)
  clicks = 0
  constructor(distance, duration, coords, type) {
    this.distance = distance // in km
    this.duration = duration // in min
    this.coords = coords // [lat, lng]
    this.type = type
  }

  click() {
    this.clicks++
  }
}

export default Workout
