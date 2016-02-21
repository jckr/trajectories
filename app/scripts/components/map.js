'use strict';

var r = require('r-dom');
var React = window.React = require('react');
var ReactDOM = require('react-dom');
var d3 = require('d3');

var Map = React.createClass({
  componentDidMount() {
    var ctx = document
      .getElementById('canvas').getContext('2d');
      this.paint(ctx);
  },
  paint: function paint(context) {
    ctx.lineCap = "round";
    vis.ctx.scale(vis.zoom, vis.zoom);
    
    vis.ctx.fillStyle = "#888"
    vis.ctx.fillRect(0,0, width / vis.zoom, height / vis.zoom);
  },
  render: function() {
    var height = this.props.height / this.props.zoom;
    var width = this.props.width / this.props.zoom;
    return r.div([
      r.canvas({height, id: 'canvas', width}),
      r.svg({height, width})
    ]);
  }
});

module.exports = Map;