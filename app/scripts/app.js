'use strict';
var d3 = require('d3');
var mountNode = document.getElementById('app');
var r = require('r-dom');
var React = window.React = require('react');
var ReactDOM = require('react-dom');
var constants = require('./components/constants');
var Utils = require('./components/utils');
var Map  = require('./components/map');



var App = React.createClass({
  componentDidMount: function() {
    var state = this.state;
    this._loadData(constants.CITIES[state.city]);  
  },
  _loadData: function loadData(city) {
    console.log('in load data');
    var promises = [city.nodes, city.streets, city.paths].map(Utils.loadCsv);
    Promise.all(promises).then(function resolvePromises(dataArray) {
      var rawNodes = dataArray[0];
      var streets = dataArray[1];
      var paths = dataArray[2];
      
      console.log('state updated');
      var preparedEdges = Utils.prepareEdges({
        nodes: rawNodes,
        paths,
        width: constants.SETTINGS.WIDTH,
        height: constants.SETTINGS.HEIGHT,
        zoom: constants.SETTINGS.ZOOM
      });
      //console.log(Utils.dijkstra({nodes: preparedEdges.nodes, edges: preparedEdges.edges.edgesHash, source: 0}));
      this.setState({
        edges: preparedEdges.edges,
        nodes: preparedEdges.nodes,
        paths,
        projection: preparedEdges.projection
        voronoi: preparedEdges.voronoi
      });
    }.bind(this));
  },
  getInitialState: function() {
    return {
      city: "Paris"
    };
  },
  render: function() {
    var state = this.state;
    return (state && state.edges) ?
      r(Map, {
        edges: state.edges,
        height: constants.SETTINGS.HEIGHT,
        mountNode,
        nodes: state.nodes,
        projection: state.projection,
        rendering: constants.SETTINGS.RENDERING,
        width: constants.SETTINGS.WIDTH,
        zoom: constants.SETTINGS.ZOOM
      }) : r.div('loading...');
  }
});

ReactDOM.render(r(App), mountNode);

