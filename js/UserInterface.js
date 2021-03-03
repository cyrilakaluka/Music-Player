export default class UserInterface {
  constructor(db) {
    this.db = db;
    this.config = this._validateConfig(db.getUIConfig());
    this.patterns = this._getPatternsFromDOM();
    this.accents = this._getAccentsFromDOM();
  }

  initialize() {
    this._importDOMElements()._initializeUI()._addEventListeners();
  }

  _importDOMElements() {
    this.root = document.documentElement;
    this.background = document.getElementById('background');
    this.themeToggle = document.getElementById('theme-toggle');
    this.patternToggle = document.getElementById('pattern-toggle');
    this.accentToggle = document.getElementById('accent-toggle');
    this.bgAccentToggle = document.getElementById('bg-accent-toggle');
    this.patternsParentEl = document.getElementById('patterns');
    this.patternSlideLeft = document.getElementById('patterns-slide-left');
    this.patternSlideRight = document.getElementById('patterns-slide-right');
    this.accentSelection = document.getElementById('accent-selection');
    this.openSettings = document.getElementById('open-settings');
    this.closeSettings = document.getElementById('close-settings');
    this.settingsWindow = document.getElementById('settings-window');
    return this;
  }

  _addEventListeners() {
    this.themeToggle.addEventListener('change', this._onThemeToggle);
    this.patternToggle.addEventListener('change', this._onPatternToggle);
    this.accentToggle.addEventListener('change', this._onAccentColorToggle);
    this.bgAccentToggle.addEventListener('change', this._onBgAccentToggle);
    this.patternSlideLeft.addEventListener('click', this._onPatternsSlide);
    this.patternSlideRight.addEventListener('click', this._onPatternsSlide);
    this.accentSelection.addEventListener('change', this._onAccentSelection);
    this.openSettings.addEventListener('click', this._onSettingsWindowStateChange);
    this.closeSettings.addEventListener('click', this._onSettingsWindowStateChange);
    return this;
  }

  _initializeUI() {
    this.root.dataset.theme = this.config.theme;
    this._configureBackgroundPattern();
    this._configureAccentColor();
    this._configureBgAccentColor();
    this._updateUIToggles();
    return this;
  }

  // DOM retrieval / manipulation functions

  _configureBackgroundPattern() {
    const status = this.config.pattern.status;
    if (status === 'disabled') {
      this._removeBgPattern();
    } else {
      if (status === 'random') {
        this.config.pattern.id = this._getRandomBgPatternId();
      }
      this._setBgPattern();
      this._updatePatternOnSettingsUI();
    }

    status === 'enabled'
      ? this.patternsParentEl.classList.remove('disabled')
      : this.patternsParentEl.classList.add('disabled');
  }

  _configureAccentColor() {
    const status = this.config.accent.status;

    if (status === 'disabled') {
      this._removeAccentColor();
    } else {
      if (status === 'random') this.config.accent.color = this._getRandomAccentColor();
      this._setAccentColor();
    }
    this._configureBgAccentColor();
    this._updateAccentOnSettingsUI();
  }

  _configureBgAccentColor() {
    const { bgEnabled, status } = this.config.accent;
    const patternStatus = this.config.pattern.status;
    if (bgEnabled && status !== 'disabled') {
      this._enableBgAccentColor();
    } else {
      if (patternStatus === 'disabled') {
        this._setBgAccentTransparent();
      } else {
        this._disableBgAccentColor();
      }
    }
  }

  _updateUIToggles() {
    const update3StateToggle = (parent, status, type) => {
      const toggles = parent.querySelectorAll(`[name="${type}-toggle"]`);
      toggles.forEach(toggle => {
        toggle.checked = toggle.value === status;
      });
    };

    update3StateToggle(this.patternToggle, this.config.pattern.status, 'pattern');
    update3StateToggle(this.accentToggle, this.config.accent.status, 'accent');
    this.bgAccentToggle.checked = this.config.accent.bgEnabled;
    this.themeToggle.checked = this.config.theme === 'dark';
  }

  _updateAccentOnSettingsUI() {
    const selectors = this.accentSelection.querySelectorAll('[name="accent"]');
    const { status, color } = this.config.accent;
    const classList = this.accentSelection.classList;

    const updateWhenDisabled = selector => {
      selector.checked = false;
      selector.setAttribute('disabled', '');
    };
    const updateWhenNotDisabled = selector => {
      if (status === 'enabled') {
        selector.removeAttribute('disabled');
      }
      selector.checked = selector.value === color;
    };
    const addClass = whatClass => classList.add(whatClass);
    const removeClass = whatClass => classList.remove(whatClass);
    const update = status === 'disabled' ? updateWhenDisabled : updateWhenNotDisabled;

    selectors.forEach(selector => update(selector));
    status === 'enabled' ? removeClass('disabled') : addClass('disabled');
  }

  _updatePatternOnSettingsUI() {
    const domPatterns = this.patternsParentEl.querySelectorAll('.pattern');
    const { id: pattern } = this.config.pattern;
    domPatterns.forEach((p, idx) => {
      if (p.dataset.pattern === pattern) {
        this.patternsParentEl.dataset.active = pattern;
        this.patternsParentEl.style.setProperty('--translate-x-factor', idx);
      }
    });
  }

  _setBgPattern() {
    const { id: pattern } = this.config.pattern;
    const size = this.patterns.find(item => item.id === pattern).size;
    this.root.style.setProperty('--background-image', `url("images/sprite.svg#${pattern}")`);
    this.root.style.setProperty('--background-image-size', size);
  }

  _removeBgPattern() {
    this.root.style.setProperty('--background-image', 'none');
  }

  _setAccentColor() {
    this.root.style.setProperty('--accent-color', `var(--accent-${this.config.accent.color})`);
  }

  _removeAccentColor() {
    this.root.style.setProperty('--accent-color', 'var(--accent-off)');
  }

  _enableBgAccentColor() {
    this.background.style.removeProperty('--accent-color');
  }

  _disableBgAccentColor() {
    this.background.style.setProperty('--accent-color', 'var(--accent-off)');
  }

  _setBgAccentTransparent() {
    this.background.style.setProperty('--accent-color', 'transparent');
  }

  _getPatternsFromDOM() {
    const patterns = document.querySelectorAll('[data-pattern]');
    return Array.from(patterns).map(pattern => ({
      id: pattern.dataset.pattern,
      size: pattern.dataset.size,
    }));
  }

  _getAccentsFromDOM() {
    const accents = document.querySelectorAll('[name="accent"]');
    return Array.from(accents)
      .map(item => item.value)
      .filter(value => value !== 'none');
  }

  // Helper Functions
  _getRandomBgPatternId() {
    return this.patterns[Math.floor(Math.random() * this.patterns.length)].id;
  }

  _getRandomAccentColor() {
    return this.accents[Math.floor(Math.random() * this.accents.length)];
  }

  _validateConfig(config) {
    let output = {};

    if (!config || !Object.keys(config).length) {
      output = this._getDefaultConfig();
    } else {
      const setPropOrDefault = (base, transfer, def) => {
        for (let key in def) {
          transfer[key] = base?.[key] ?? def[key];
        }
      };
      const defaultSettings = this._getDefaultConfig();
      setPropOrDefault(config, output, defaultSettings);
      setPropOrDefault(config?.pattern, output.pattern, defaultSettings.pattern);
      setPropOrDefault(config?.accent, output.accent, defaultSettings.accent);
    }
    this.db.saveUIConfig(output);
    return output;
  }

  _getDefaultConfig() {
    return {
      theme: 'light',
      pattern: {
        status: 'random',
        id: 'circuit-board',
      },
      accent: {
        status: 'random',
        color: 'indigo',
        bgEnabled: true,
      },
    };
  }

  _saveConfigToDb() {
    this.db.saveUIConfig(this.config);
  }

  // Event Listener Callbacks
  _onThemeToggle = event => {
    this.config.theme = event.target.checked ? 'dark' : 'light';
    this.root.dataset.theme = this.config.theme;
    this._saveConfigToDb();
  };

  _onPatternToggle = event => {
    let status = event.target.value;
    const activePattern = this.patternsParentEl.dataset.active;
    this.config.pattern.status = status;

    if (status === 'enabled') {
      this.config.pattern.id = activePattern || this._getDefaultConfig().pattern.id;
    }

    this._configureBackgroundPattern();
    this._configureBgAccentColor();
    this._saveConfigToDb();
  };

  _onAccentColorToggle = event => {
    this.config.accent.status = event.target.value;
    this._configureAccentColor();
    this._saveConfigToDb();
  };

  _onBgAccentToggle = event => {
    this.config.accent.bgEnabled = event.target.checked;

    this._configureBgAccentColor();

    this._saveConfigToDb();
  };

  _onPatternsSlide = event => {
    const left = event.target.closest('#patterns-slide-left') !== null;
    const selected = this.patternsParentEl.dataset.active;
    const patterns = this.patternsParentEl.querySelectorAll('.pattern');
    const getNextPatternIndex = index => {
      if (left) {
        return index === 0 ? patterns.length - 1 : index - 1;
      }
      return index === patterns.length - 1 ? 0 : index + 1;
    };
    for (let i = 0; i < patterns.length; i++) {
      if (patterns[i].dataset.pattern === selected) {
        const nextPatternIdx = getNextPatternIndex(i);
        const nextPattern = patterns[nextPatternIdx].dataset.pattern;
        this.patternsParentEl.style.setProperty('--translate-x-factor', nextPatternIdx);
        this.patternsParentEl.dataset.active = nextPattern;
        this.config.pattern.id = nextPattern;
        this._setBgPattern();
        this._saveConfigToDb();
        break;
      }
    }
  };

  _onAccentSelection = event => {
    this.config.accent.color = event.target.value;
    this._setAccentColor();
    this._saveConfigToDb();
  };

  _onOutsideSettingWindowClick = event => {
    if (!event.target.closest('#settings-window')) {
      this._onSettingsWindowStateChange(event);
    }
  };

  _onSettingsWindowStateChange = event => {
    event.stopPropagation();
    const opening = event.target.id === 'open-settings';

    const onWindowAnimationEnd = () => {
      this.settingsWindow.style.setProperty('--transform-state', `scale(${opening ? 1 : 0})`);
      this.settingsWindow.removeEventListener('animationend', onWindowAnimationEnd);
    };

    const resetSettingsWindow = () => {
      // Remove previous animation end listener if any
      this.settingsWindow.removeEventListener('animationend', onWindowAnimationEnd);
      // Ensure --transform-state has the right value
      this.settingsWindow.style.setProperty('--transform-state', `scale(${opening ? 0 : 1})`);
      // Remove all animation classes
      this.settingsWindow.classList.remove('open', 'closed');
      // Set button status
      this.openSettings.disabled = opening;
      this.closeSettings.disabled = !opening;
    };
    const addAnimationEndListener = () => this.settingsWindow.addEventListener('animationend', onWindowAnimationEnd);

    const onOutsideSettingWindowClick = event => {};

    const setSettingsWidowState = () => {
      this.settingsWindow.classList.add(opening ? 'open' : 'closed');
      setupDocumentListener();
    };

    const setupDocumentListener = () => {
      if (opening) {
        this.root.addEventListener('click', this._onOutsideSettingWindowClick);
        return;
      }
      this.root.removeEventListener('click', this._onOutsideSettingWindowClick);
    };

    resetSettingsWindow();
    addAnimationEndListener();
    setTimeout(setSettingsWidowState, 5);
  };
}
