const LocalStorage = (function () {
  const storageKey = 'CM Player';
  const database = {
    uiConfig: {},
    playerConfig: {},
    loadData() {
      const storedData = JSON.parse(localStorage.getItem(storageKey));
      this.playerConfig = storedData?.playerConfig || {};
      this.uiConfig = storedData?.uiConfig || {};
    },
    saveData() {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          uiConfig: this.uiConfig,
          playerConfig: this.playerConfig,
        })
      );
    },
  };

  class LocalStorage {
    constructor() {
      database.loadData();
    }

    getUIConfig = () => database.uiConfig;

    getPlayerConfig = () => database.playerConfig;

    saveUIConfig(config) {
      database.uiConfig = config;
      database.saveData();
    }

    savePlayerConfig(config) {
      database.playerConfig = config;
      database.saveData();
    }
  }
  return LocalStorage;
})();

export default new LocalStorage();
