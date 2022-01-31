'use strict'
// prettier-ignore
import {logo,form, inputType, inputDistance, inputDuration, inputCadence, inputElevation,containerWorkouts} from "../helpers/selectors.js"
import Running from './running.js'
import Cycling from './cycling.js'

class App {
    #map
    #clickedCoords
    #workouts = []
    #markers

    constructor() {
        this._getPosition()
        inputType.addEventListener('change', this._toggleElevationField)
        form.addEventListener('submit', this._newWorkout.bind(this))
        containerWorkouts.addEventListener('click', this._panToWorkout.bind(this))
        logo.addEventListener('click', this._clearLocalStorage.bind(this))
        this._getLocalStorage()
    }

    _dateFormatter(date) {
        return new Intl.DateTimeFormat('en', {
            month: 'long',
            day: 'numeric',
        }).format(date)
    }

    _panToWorkout(e) {
        const clicked = e?.target.closest('.workout')
        if (!clicked) return
        const workout = this.#workouts.find(el => el.id === clicked.dataset.id)
        workout.click()
        this.#map.setView(workout.coords, 13, {
            animate: true,
            pan: { duration: 1 },
        })
    }

    _getPosition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), err =>
                console.log(err)
            )
        }
        return this
    }

    _loadMap(position) {
        const { latitude, longitude } = position.coords
        const coords = [latitude, longitude]
        this.#markers = L.layerGroup()
        this.#map = L.map('map').setView(coords, 11)
        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(this.#map)

        this.#map.on('click', this._showForm.bind(this))
        this._fixMarkerIcon()

        if (this.#workouts.length > 0) {
            this._renderList()
            this._renderMarkers()
        }
        return this
    }

    _showForm(e) {
        this.#clickedCoords = [e.latlng.lat, e.latlng.lng]
        form.classList.remove('hidden')
        inputDistance.focus()
        return this
    }

    _fixMarkerIcon() {
        delete L.Icon.Default.prototype._getIconUrl
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        })
        return this
    }

    _toggleElevationField() {
        inputDistance.focus()
        inputElevation.parentElement.classList.toggle('form__row--hidden')
        inputCadence.parentElement.classList.toggle('form__row--hidden')
        return this
    }

    _renderMarkers() {
        this.#markers.clearLayers()
        this.#workouts.forEach(el => {
            const marker = L.marker(el.coords)
                .bindPopup(
                    L.popup({
                        maxWidth: 250,
                        minWidth: 100,
                        autoClose: false,
                        closeOnClick: false,
                        className: `${el.type}-popup`,
                    })
                )
                .setPopupContent(
                    `🏃‍♂️ ${el.type[0].toUpperCase() + el.type.slice(1)} on ${this._dateFormatter(
                        el.date
                    )}`
                )
                .openPopup()

            this.#markers.addLayer(marker)
        })

        this.#map.addLayer(this.#markers)
        this.#markers.eachLayer(layer => layer.openPopup())
    }

    _renderList() {
        document.querySelectorAll('.workout').forEach(el => el.remove())
        this.#workouts.forEach(el => {
            const html = `
      <li class="workout workout--${el.type}" data-id="${el.id}">
        <h2 class="workout__title">${
            el.type[0].toUpperCase() + el.type.slice(1)
        } on ${this._dateFormatter(el.date)}</h2>
        <div class="workout__details">
          <span class="workout__icon">${el.type === 'running' ? '🏃‍♂️' : '🚴‍♂️'}</span>
          <span class="workout__value">${el.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${el.duration}</span>
          <span class="workout__unit">min</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${
              el.type === 'running' ? el.cadance : el.speed?.toFixed(1)
          }</span>
          <span class="workout__unit">${el.type === 'running' ? 'min/km' : 'min/h'}</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">${el.type === 'running' ? '🦶🏼' : '🚵‍♂️'}</span>
          <span class="workout__value">${
              el.type === 'running' ? el.pace.toFixed(1) : el.elevation
          }</span>
          <span class="workout__unit">${el.type === 'running' ? 'spm' : 'm'}</span>
        </div>
      </li>`
            form.insertAdjacentHTML('afterend', html)
        })
    }

    _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts))
    }

    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'))
        if (!data) return
        this.#workouts = data
    }

    _clearLocalStorage() {
        this.#workouts = []
        localStorage.removeItem('workouts')
        document.querySelectorAll('.workout').forEach(el => el.remove())
        this.#markers.clearLayers()
    }

    _newWorkout(e) {
        const isPositive = (...inputs) => inputs.every(inp => inp > 0)
        const formValidator = (...inputs) => inputs.every(inp => Number.isFinite(inp))

        e.preventDefault()
        const type = inputType.value
        const distance = +inputDistance.value
        const duration = +inputDuration.value
        const coords = this.#clickedCoords
        let workout

        if (type === 'running') {
            const cadance = +inputCadence.value
            if (
                !formValidator(distance, duration, cadance) ||
                !isPositive(distance, duration, cadance)
            )
                return alert('Not a valid input')
            workout = new Running(distance, duration, coords, cadance, type)
        }

        if (type === 'cycling') {
            const elevation = +inputElevation.value
            if (!formValidator(distance, duration, elevation) || !isPositive(distance, duration))
                return alert('Not a valid input')
            workout = new Cycling(distance, duration, coords, elevation, type)
        }

        this.#workouts.push(workout)
        this._setLocalStorage()

        // prettier-ignore
        inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value = ''

        this._renderMarkers()
        this._renderList()

        form.style.display = 'none'
        form.classList.add('hidden')
        setTimeout(() => {
            form.style.display = 'grid'
            if (window.innerWidth <= 600) {
                form.style.display = 'flex'
            }
        }, 1000)
        return this
    }
}

export default App
