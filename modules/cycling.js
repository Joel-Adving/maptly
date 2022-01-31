'use strict'

import Workout from './workout.js'

class Cycling extends Workout {
  constructor(distance, duration, coords, elevation, type) {
    super(distance, duration, coords, type)
    this.elevation = elevation
    this.calcSpeed()
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60)
    return this.speed
  }
}

export default Cycling
