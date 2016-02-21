const document = require('global/document');
const mountNode = document.getElementById('app');
const r = require('r-dom');
const React = require('react');
const ReactDOM = require('react-dom');
const constants = require('./components/constants');
const Utils = require('./components/utils');
const Map = require('./components/map');

const App = React.createClass({
  componentDidMount: function cdm() {
    const state = this.state;
    this._loadData(constants.CITIES[state.city]);
  },
  _loadData: function loadData(city) {
    const promises = [city.nodes, city.paths].map(Utils.loadCsv);
    Promise.all(promises).then(function resolvePromises(dataArray) {
      const rawNodes = dataArray[0];
      const paths = dataArray[1];

      const preparedEdges = Utils.prepareEdges({
        nodes: rawNodes,
        paths,
        width: constants.SETTINGS.WIDTH,
        height: constants.SETTINGS.HEIGHT,
        zoom: constants.SETTINGS.ZOOM
      });

      this.setState({
        edges: preparedEdges.edges,
        nodes: preparedEdges.nodes,
        paths,
        projection: preparedEdges.projection,
        voronoi: preparedEdges.voronoi
      });
    }.bind(this));
  },
  getInitialState: function getInitialState() {
    return {
      city: 'Paris'
    };
  },
  render: function render() {
    const state = this.state;
    return (state && state.edges) ?
      r(Map, {
        edges: state.edges,
        height: constants.SETTINGS.HEIGHT,
        mountNode,
        nodes: state.nodes,
        projection: state.projection,
        rendering: constants.SETTINGS.RENDERING,
        voronoi: state.voroni,
        width: constants.SETTINGS.WIDTH,
        zoom: constants.SETTINGS.ZOOM
      }) : r.div('loading...');
  }
});

ReactDOM.render(r(App), mountNode);

