export default class Slider {
  constructor(config) {
    this.config = this._validateConfig(config);
    this._init();
  }

  // Public methods
  setProgress(value) {
    const { min, max } = this.config;
    if (!(value >= min && value <= max)) {
      throw `The value, ${value} is not within expected range: ${min}, ${max}`;
    }
    this._progress.set(value);
  }
  // Initializers
  _init() {
    this._progress.initialize()._addEventListeners();
  }

  _addEventListeners() {
    this.config.track.addEventListener('click', this._onProgressUpdate);
    this.config.ball.addEventListener('mousedown', this._onBallMouseEventStart);
    this.config.ball.addEventListener('click', e => e.stopPropagation());
    return this;
  }

  // Event Listener callbacks
  _onProgressUpdate = event => {
    this._progress.update(event);
  };

  _onBallMouseEventStart = event => {
    if (event.button === 0) {
      event.preventDefault();
      event.stopPropagation();
      this._onProgressUpdate(event);
      document.addEventListener('mousemove', this._onProgressUpdate);
      document.addEventListener('mouseup', this._onBallMouseEventEnd);
    }
  };

  _onBallMouseEventEnd = event => {
    this._progress.update(event);
    document.removeEventListener('mousemove', this._onProgressUpdate);
    document.removeEventListener('mouseup', this._onBallMouseEventEnd);
  };

  // Updates progress on DOM and notifies update
  _progress = (() => {
    let track, prevProgress, currProgress, progressChanged, justOutOfRange;

    const initialize = () => {
      track = this.config.track;
      currProgress = prevProgress = this.config.initValue;
      const progressPercent = this._scaleValueToPercent(currProgress);
      updateDOM(progressPercent);
      display(this.config.initValue);
      return this;
    };

    const set = value => {
      currProgress = prevProgress = value;
      const percentProgress = this._scaleValueToPercent(currProgress);
      updateDOM(percentProgress);
    };

    const update = event => {
      const { left, width } = track.getBoundingClientRect();
      const pointX = event.clientX - left;
      const updateX = pointX < 0 ? 0 : pointX > width ? width : pointX;
      const eventWithinRange = pointX >= 0 && pointX <= width;

      if (!justOutOfRange) {
        const progressPercent = (updateX / width) * 100;
        currProgress = this._scalePercentToValue(progressPercent);
        progressChanged = currProgress != prevProgress;
        if (progressChanged) {
          updateDOM(progressPercent);
        }
        notify(event, currProgress);
        display(currProgress);
        prevProgress = currProgress;
      }
      justOutOfRange = !eventWithinRange;
    };

    const notify = (event, value) => {
      const run = {
        mousedown: this.config.notifyStart,
        mouseup: this.config.notifyEnd,
        mousemove: progressChanged && this.config.notifyRealtime,
        click: this.config.notifyEnd,
      };
      run[event.type] && run[event.type](value);
    };

    const display = value => {
      if (this.config.display) {
        value = this.config.roundOnDisplay ? Math.round(value) : value;
        this.config.display.textContent = value;
      }
    };

    const updateDOM = percent => {
      this.config.track.style.setProperty('--progress-value', percent + '%');
    };

    return { initialize, update, set };
  })();

  // Helper functions
  _scaleValueToPercent(value) {
    return ((value - this.config.min) * 100) / (this.config.max - this.config.min);
  }

  _scalePercentToValue(percent) {
    const scale = (this.config.max - this.config.min) / 100;
    let value = percent * scale + this.config.min;
    if (this.config.round) {
      value = Math.round(value);
    }

    return value;
  }

  _validateConfig(config) {
    const { track, ball, min, max, initValue, notifyStart, notifyRealtime, notifyEnd } = config;

    if (!(config || Object.keys(config).length)) {
      throw 'Configuration must be provided';
    }

    if (!track) {
      throw 'Slider track must be provided!';
    }

    if (!ball) {
      throw 'Slider ball must be provided!';
    }

    if (min && max && min >= max) {
      throw 'Max configuration value must be greater than minimum!';
    }

    if (notifyStart && typeof notifyStart !== 'function') {
      throw 'Notify start is provided but it is not a function';
    }

    if (notifyRealtime && typeof notifyRealtime !== 'function') {
      throw 'Notify realtime is provided but it is not a function';
    }

    if (notifyEnd && typeof notifyEnd !== 'function') {
      throw 'Notify End is provided but it is not a function';
    }

    if (initValue && !(initValue >= min && initValue <= max)) {
      throw 'Initial value is not within min, max range';
    }

    config.min = min ?? 0;
    config.max = max ?? 100;
    config.initValue = initValue ?? 0;
    return config;
  }
}
