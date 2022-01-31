'use strict'

import Workout from './workout.js'

class Running extends Workout {
  constructor(distance, duration, coords, cadance, type) {
    super(distance, duration, coords, type)
    this.cadance = cadance
    this.calcPace()
  }

  calcPace() {
    this.pace = this.duration / this.distance
    return this.pace
  }
}

export default Running
