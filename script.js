'use strict';

class Workout {
  date = new Date();
  id = new Date() + ''.slice(-10);
  clicks = 0;
  constructor(coords, distance, duration) {
    //this.date=...
    //this.id=...
    this.coords = coords; //[latitude, longitudes]
    this.distance = distance; //in km
    this.duration = duration; //in min
  }
  _setDescription() {
    //prettier-ignore
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    this.description = `${this.type[0].toUpperCase()} ${this.type.slice(
      1
    )} on ${months[this.date.getMonth()]}  ${this.date.getDate()}`;
  }
  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.type = 'running';
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    //min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.type = 'cycling';
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    //km/hr
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const run1 = new Running([39, -12], 5.2, 24, 178);
// const cycl1 = new Cycling([39, -12], 27, 25, 523);
// console.log(run1, cycl1);

// /////////////////////////////////////////
//Application ARCHITECTURE

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form_input--type');
const inputDistance = document.querySelector('.form_input--distance');
const inputDuration = document.querySelector('.form_input--duration');
const inputCadence = document.querySelector('.form_input--cadence');
const inputElevation = document.querySelector('.form_input--elevation');

class App {
  #map;
  #mapEvent;
  #workouts = [];
  #mapZoomLevel = 13;
  constructor() {
    this._getPosition();
    form.addEventListener('submit', this._newWorkout.bind(this));

    //this closest () is an inverse query selector it selects only parent not children
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }

  _loadMap(position) {
    // console.log(position);

    const { latitude, longitude } = position.coords;
    //console.log(latitude, longitude);
    // console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    //to replace default latitude and longitude-> new array->coords
    const coords = [latitude, longitude];

    //leaflet map
    //console.log(this);
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
    //console.log(map);

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //this on method is not a part of js it is coming from leaflet library

    //Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    //Empty input + add hidden class
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }
  _toggleElevationField() {
    inputElevation.closest('.form_row').classList.toggle('form_row--hidden');
    inputCadence.closest('.form_row').classList.toggle('from_row--hidden');
  }

  _newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    //Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    //If workout running, create running
    if (type === 'running') {
      const cadence = +inputCadence.value;
      //check if data is valid
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)

        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    //If workout cycling, create cycling
    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers!');
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    //Add new object to workout array
    this.#workouts.push(workout);
    console.log(workout);

    //Render workout on map as marker
    this._renderWorkoutMarker(workout);

    //Render workout on list
    this._renderWorkout(workout);

    //Hide form+ clear the input fields

    this._hideForm();

    //Display marker
    //console.log(this.#mapEvent);
  }
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃🏻‍♂️' : '🚴🏻'}${workout.description}`
      )
      .openPopup();
  }
  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
    <h2 class="workout_title">${workout.description}</h2>
    <div class="workout_details">
      <span class="workout_icon">${
        workout.type === 'running' ? '🏃🏻‍♂️' : '🚴🏻'
      }</span>
      <span class="workout_value">${workout.distance}</span>
      <span class="workout_unit">km</span>
    </div>
    <div class="workout_details">
      <span class="workout_icon">⏱️</span>
      <span class="workout_value">${workout.duration}</span>
      <span class="workout_unit">min</span>
    </div>
    `;
    if (workout.type === 'running')
      html += `<div class="workout_details">
    <span class="workout_icon">⚡</span>
    <span class="workout_value">${workout.pace.toFixed(1)}</span>
    <span class="workout_unit">min/km</span>
  </div>
  <div class="workout_details">
    <span class="workout_icon">🦶🏻</span>
    <span class="workout_value">${workout.cadence}</span>
    <span class="workout_unit">spm</span>
  </div>
</li>`;
    if (workout.type === 'cycling')
      html += `
      <div class="workout_details">
      <span class="workout_icon">⚡</span>
      <span class="workout_value">${workout.speed.toFixed(1)}</span>
      <span class="workout_unit">km/h</span>
    </div>
    <div class="workout_details">
      <span class="workout_icon">🛣️</span>
      <span class="workout_value">${workout.elevationGain}</span>
      <span class="workout_unit">m</span>
    </div>
  </li>
`;

    form.insertAdjacentHTML('afterend', html);
  }
  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    console.log(workoutEl);

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    console.log(workout);

    this.#map.setView(workout, coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    //using the public interface
    workout.click();
  }
}

// Geolocation

//console.log(firstName);

const app = new App();
