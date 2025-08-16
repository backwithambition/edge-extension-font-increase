// Mock Chrome extension API
global.chrome = {
  runtime: {
    onInstalled: {
      addListener: jest.fn()
    },
    onMessage: {
      addListener: jest.fn()
    },
    sendMessage: jest.fn()
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  },
  downloads: {
    download: jest.fn()
  }
};

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn();

// Mock window.location
delete window.location;
window.location = {
  reload: jest.fn()
};