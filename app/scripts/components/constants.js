const CITIES = {
  Paris: {
    name: 'Paris',
    nodes: './data/Paris/nodes.csv',
    streets: './data/Paris/ways.csv',
    paths: './data/Paris/nodes_in_ways.csv'
  },
  SF: {
    name: 'San Francisco',
    nodes: './data/SF/nodes.csv',
    streets: './data/SF/ways.csv',
    paths: './data/SF/nodes_in_ways.csv'
  }
};

const SETTINGS = {
  HEIGHT: 720,
  RENDERING: 'canvas',
  WIDTH: 1011,
  ZOOM: 0.5
};

module.exports = {
  CITIES,
  SETTINGS
};
