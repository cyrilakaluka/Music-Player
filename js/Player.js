import Slider from './Slider.js';

export default class Player {
  constructor(db) {
    this.db = db;
    this.config = db.getPlayerConfig();
    this.audio = new Audio();
    this.controller = new Controller(this.audio, this._getTrackList());
    this.controller.adjustVolume(this.config.volume);
  }

  initialize() {
    this._importDOMElements()._initControls()._addEventListeners();
  }

  _importDOMElements() {
    this.trackSlider = document.getElementById('track-slider');
    this.volumeSlider = document.getElementById('volume-slider');
    this.trackSliderBall = this.trackSlider.querySelector('.slider__ball');
    this.volumeSliderBall = this.volumeSlider.querySelector('.slider__ball');
    this.mute = document.getElementById('mute');
    this.volumeLevel = document.getElementById('volume-level');
    this.backward = document.getElementById('backward');
    this.forward = document.getElementById('forward');
    this.playPause = document.getElementById('play-pause');
    return this;
  }

  _initControls() {
    this.volumeControl = new Slider(this._getSliderConfig('volume'));
    this.trackControl = new Slider(this._getSliderConfig('track'));
    return this;
  }

  _addEventListeners() {
    this.mute.addEventListener('click', this._onAudioMute);
    this.backward.addEventListener('click', this._onAudioPrevious);
    this.forward.addEventListener('click', this._onAudioNext);
    this.playPause.addEventListener('click', this._onAudioPlayPause);
    this.audio.addEventListener('timeupdate', this._onAudioTimeUpdate);
    return this;
  }

  // Event Listener Callbacks
  _onAudioPlayPause = () => {
    const playIcon = this.playPause.querySelector('.icon');
    if (!this.controller.isPlaying) {
      this.controller.play();
      playIcon.classList.replace('fa-play', 'fa-pause');
    } else {
      this.controller.pause();
      playIcon.classList.replace('fa-pause', 'fa-play');
    }
  };

  _onAudioNext = () => {
    this.controller.next();
  };

  _onAudioPrevious = () => {
    this.controller.prev();
  };

  _onAudioTimeUpdate = () => {
    this.controller.updateCurrentTimeOnUI();
    this.trackControl.setProgress(this.controller.currentTimePercentage);
  };

  _onTrackSeekStart = () => {
    this.controller.saveCurrentState();
    if (this.controller.isPlaying) this.controller.pause();
  };

  _onTrackSeekRealTime = percentTime => {
    this.controller.setCurrentTime(percentTime);
    this.controller.updateCurrentTimeOnUI();
  };

  _onTrackSeekEnd = percentTime => {
    this.controller.setCurrentTime(percentTime);
    if (this.controller.savedState.playing) this.controller.play();
  };

  _onVolumeAdjustment = volume => {
    this.controller.adjustVolume(volume);
    this.config.volume = volume;
    this._saveConfigToDb();
  };

  // Helper methods
  _getSliderConfig(type) {
    if (type === 'track') {
      return {
        track: this.trackSlider,
        ball: this.trackSliderBall,
        min: 0,
        max: 100,
        round: true,
        initValue: 0,
        notifyStart: this._onTrackSeekStart,
        notifyRealtime: this._onTrackSeekRealTime,
        notifyEnd: this._onTrackSeekEnd,
      };
    }

    return {
      track: this.volumeSlider,
      ball: this.volumeSliderBall,
      display: this.volumeLevel,
      min: 0,
      max: 100,
      round: false,
      roundOnDisplay: true,
      initValue: this.config.volume || 40,
      notifyStart: null,
      notifyRealtime: this._onVolumeAdjustment,
      notifyEnd: this._onVolumeAdjustment,
    };
  }

  _getTrackList() {
    return [
      {
        name: 'highway',
        displayName: 'High Way',
        artist: 'DJ Kaywise ft. Phyno',
      },
      {
        name: 'koleyewon',
        displayName: 'Koleyewon',
        artist: 'Naira Marley',
      },
      {
        name: 'woman',
        displayName: 'Woman',
        artist: 'Rema',
      },
      {
        name: 'makeup-your-mind',
        displayName: 'Make Up Your Mind',
        artist: 'Ice Prince ft. Tekno',
      },
    ];
  }

  _saveConfigToDb() {
    this.db.savePlayerConfig(this.config);
  }
}

const Controller = (() => {
  let audio,
    currentTrack,
    trackList = [],
    isPlaying,
    savedState = { playing: false };

  const dom = {
    trackName: document.getElementById('track-name'),
    trackArtist: document.getElementById('track-artist'),
    trackArt: document.getElementById('track-art'),
    currentTime: document.getElementById('current-time'),
    totalDuration: document.getElementById('total-duration'),
  };

  function initialize() {
    isPlaying = false;
    currentTrack = trackList[0];
    loadTrack(currentTrack);
  }

  function onAudioCanPlay() {
    dom.totalDuration.textContent = formatTime(audio.duration);
    dom.currentTime.textContent = '0:00';
    audio.removeEventListener('canplay', onAudioCanPlay);
  }

  function loadTrack(track) {
    dom.trackName.textContent = track.displayName;
    dom.trackArtist.textContent = track.artist;
    dom.trackArt.style.setProperty('--track-art-image-url', `url("images/${track.name}.jpg")`);
    audio.src = `music/${track.name}.mp3`;
    audio.addEventListener('canplay', onAudioCanPlay);
  }

  function formatTime(time) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${(seconds < 10 ? '0' : '') + seconds}`;
  }

  class Controller {
    constructor(_audio, _trackList) {
      audio = _audio;
      trackList = _trackList;
      initialize();
    }

    next = () => {
      const currIdx = trackList.indexOf(currentTrack);
      const nextTrack = currIdx === trackList.length - 1 ? trackList[0] : trackList[currIdx + 1];
      loadTrack.call(this, nextTrack);
      if (isPlaying) this.play();
      currentTrack = nextTrack;
    };

    prev = () => {
      const currIdx = trackList.indexOf(currentTrack);
      const prevTrack = currIdx === 0 ? trackList[trackList.length - 1] : trackList[currIdx - 1];
      loadTrack.call(this, prevTrack);
      if (isPlaying) this.play();
      currentTrack = prevTrack;
    };

    play = () => {
      audio.play();
      isPlaying = true;
    };

    pause = () => {
      audio.pause();
      isPlaying = false;
    };

    get isPlaying() {
      return isPlaying;
    }

    updateCurrentTimeOnUI = () => {
      dom.currentTime.textContent = formatTime(audio.currentTime);
    };

    setCurrentTime = percentTime => {
      audio.currentTime = (percentTime / 100) * audio.duration;
    };

    get currentTimePercentage() {
      return (audio.currentTime / audio.duration) * 100 || 0;
    }

    saveCurrentState() {
      savedState.playing = isPlaying;
    }

    get savedState() {
      return savedState;
    }

    adjustVolume(value) {
      audio.volume = value / 100;
    }
  }

  return Controller;
})();
