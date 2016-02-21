'use strict';

var d3 = require('d3');
var BinaryHeap = require('./BinaryHeap');

function setProj(bbox, viewpoint) {
  if (bbox.length !== 2) {
    return;
  }
  if (!viewpoint) {
    viewpoint = [960, 500];
  }
  var proj = d3.geo.mercator();
  var p1 = proj(bbox[0]);
  var p2 = proj(bbox[1]);

  const center = [
    (bbox[0][0] + bbox[1][0]) / 2,
    (bbox[0][1] + bbox[1][1]) / 2
  ];

  proj.center(center);

  var x1 = Math.min(p1[0], p2[0]);
  var x2 = Math.max(p1[0], p2[0]);
  var y1 = Math.min(p1[1], p2[1]);
  var y2 = Math.max(p1[1], p2[1]);

  const w = x2 - x1;
  const h = y2 - y1;

  const rw = viewpoint[0] / w
  const rh = viewpoint[1] / h

  const r = Math.min(rw, rh);
  proj.scale(proj.scale() * r);

  // vis.center = center
  // vis.bbox = bbox;
  
  p1 = proj(bbox[0]);
  p2 = proj(bbox[1]);
  x1 = Math.min(p1[0], p2[0]);
  x2 = Math.max(p1[0], p2[0]);
  y1 = Math.min(p1[1], p2[1]);
  y2 = Math.max(p1[1], p2[1]);
  //console.log(p1,p2,x1,x2,y1,y2);
  //[-531, 875.8531374511658] [1491, -376.48361309670145] -531 1491 -376.48361309670145 875.8531374511658
  proj.translate([1011,720])
  return proj;
};

function distance(lat1, lon1, lat2, lon2) {
  var radlat1 = Math.PI * lat1/180
  var radlat2 = Math.PI * lat2/180
  var radlon1 = Math.PI * lon1/180
  var radlon2 = Math.PI * lon2/180
  var theta = lon1-lon2
  var radtheta = Math.PI * theta/180
  var dist = Math.sin(radlat1) * Math.sin(radlat2) +
    Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  dist = Math.acos(dist)
  dist = dist * 180/Math.PI
  dist = dist * 60 * 1.1515 * 1.609344 * 1000;
  return dist
}

function processPaths(nodesHash, nestedPaths) {
  var edgesHash = {};
  var edgeId = 0;
  var edgesStats = {ctEdges: 0, emptyEdge: 0, firstEdge: 0};
  var edgesArray = [];
  nestedPaths.forEach(path => {
    let previousNodeRank;
    let previousX;
    let previousY;
    let previousLon;
    let previousLat;
    path.values.forEach((nodeInPath, i) => {
      let dist = 0;
      const currentNodeId = nodeInPath.node;
      const currentNode = nodesHash[currentNodeId];
      const currentNodeRank = currentNode.rank;      

      const currentLat = currentNode.lat;
      const currentLon = currentNode.lon;
      const currentX = currentNode.x;
      const currentY = currentNode.y;
      if (i) {
        edgesStats.ctEdges++;
        if (currentLat == previousLat && currentLon == previousLon) {
          edgesStats.emptyEdge++;
        } else {
          dist = distance(currentLat, currentLon, previousLat, previousLon); // is this necessary?
          if (!edgesHash.hasOwnProperty(previousNodeRank)) {
            edgesHash[previousNodeRank] = [];
          }
          if (!edgesHash.hasOwnProperty(currentNodeRank)) {
            edgesHash[currentNodeRank] = [];
          }

          const edgeForward = {
            start: previousNodeRank, end: currentNodeRank, dist: dist, id: edgeId,
            x0: previousX,
            x1: currentX,
            y0: previousY,
            y1: currentY
          };
          const edgeBack = {
            start: currentNodeRank, end: previousNodeRank, dist: dist, id: edgeId
          };

          edgesHash[previousNodeRank].push(edgeForward);
          edgesHash[currentNodeRank].push(edgeBack);
          edgesArray.push(edgeForward);
          edgeId++;
        }
      }
      else {
        edgesStats.firstEdge++;
      }
      previousLon = currentLon;
      previousLat = currentLat;
      previousX = currentX;
      previousY = currentY;
      previousNodeRank = currentNodeRank;
    });
  })
  return {edgesHash, edgesArray, edgesStats};
}

module.exports = {
  loadCsv: function loadCsv(path) {
    return new Promise(function promiseCsv(fulfill, reject) {
      d3.csv(path, function (error, csv) {
        if (error) {
          reject(error);
        } else {
          fulfill(csv);
        }
      });
    });
  },
  prepareEdges: function({nodes, paths, height, width, zoom}) {
    var minLon = Infinity;
    var maxLon = -Infinity;
    var minLat = minLon;
    var maxLat = maxLon;
    var projection;
    var edges;

    var nodesHash = {};

    nodes.forEach((d, i) => {
      d.lon = +d.lon;
      if (d.lon < minLon) {
        minLon = d.lon;
      }
      if (d.lon > maxLon) {
        maxLon = d.lon;
      }
      d.lat = +d.lat;
      if (d.lat < minLat) {
        minLat = d.lat;
      }
      if (d.lat > minLat) {
        maxLat = d.lat;
      }
      // in the data sources the nodes and edges are referenced by their
      // OSM identifiers. Here we are rebasing them and referring to them
      // by their rank (order of appearance) in their respective arrays
      // for faster retrieval.
      d.rank = i;
      nodesHash[d.id] = d;
    })

    projection = setProj([
      [minLon, minLat],
      [maxLon, maxLat]
    ], [
      width / zoom,
      height / zoom
    ]);

    nodes.forEach((d, i) => {
      var xy = projection([d.lon, d.lat]);
      d.x = xy[0];
      d.y = xy[1];
    });

    var nestedPaths = d3.nest()
      .key(d => +d.way)
      .entries(paths);

    edges = processPaths(nodesHash, nestedPaths);
    console.log('edges prepared');

    var voronoi = d3.geom.voronoi()
      .x(d => d.x + .001 * Math.random())
      .y(d => d.y + .001 * Math.random())
      .clipExtent([[0, 0], [width / zoom, height / zoom]])
      (nodes);
    return {
      edges,
      nodes,
      projection,
      voronoi
    };
  },
  dijkstra: function ({nodes, edges, source}) {
    // nodes: array
    // edges: object
    // source: id

    var distanceToNode = nodes.map(d => Infinity);
    var usedEdges = [];
    var backtrack = {};
    var Heap = new BinaryHeap(n => distanceToNode[n]);

    distanceToNode[source] = 0;

    nodes.forEach((node, i) => Heap.push(i));

    var breakLoop = false;
    while (Heap.size && !breakLoop) {
      var currentNode = Heap.pop();
      var distanceToCurrentNode = distanceToNode[currentNode];
      if (distanceToCurrentNode === Infinity || !Heap.size()) {
        breakLoop = true;
      } else {
        if (edges[currentNode]) {
          edges[currentNode].forEach(edge => {
            const testedDistance = distanceToCurrentNode + edge.dist;
            const endNode = edge.end;
            if (testedDistance < distanceToNode[endNode]) {
              Heap.remove(endNode);
              distanceToNode[endNode] = testedDistance;
              usedEdges.push(edge);
              backtrack[endNode] = edge;
              Heap.push(endNode);
            }
          });
        } 
      }
    }
    return {distanceToNode, usedEdges, backtrack};
  },
  polygon: function polygon(d) {
    return (d && d.length && ("M" + d.join("L") + "Z")) || null;
  }
  /*vis.dijkstra = function(n, e, s) {
    var nodes = n || [{"node":0},{"node":1},{"node":2},{"node":3}];
    var edges = e || {0: [{end: 1, dist: 10}, {end: 2, dist: 20}], 1: [{end: 2, dist: 5}, {end: 0, dist: 10}], 2: [{end: 0, dist: 20}, {end: 1, dist: 5}]};
    
    var dist = d3.range(nodes.length).map(function() {return Infinity;})
    var usedEdges = [];
    var backtrack = {};
    dist[s] = 0;
    var Q = new BinaryHeap(function(v) {return dist[v];})

    nodes.forEach(function(v, i) {Q.push(i);})
    var breakloop = false;
    while (Q.size && !breakloop) {
      var u = Q.pop(), du = dist[u];
      if (du === Infinity || !Q.size()) {
        breakloop = true;
      } else {
        if(!edges[u]) {console.log(u)} else {
          edges[u].forEach(function(e) {
            var alt = du + e.dist; 
            var v = e.end;
            if(alt < dist[v]) {
              Q.remove(v);
              dist[v] = alt;
              usedEdges.push(e);
              backtrack[v] = e;
              Q.push(v);
            }
          })  
        }
        
      }
    }
    return {distances:dist, edges:usedEdges, backtrack: backtrack};
  }*/
}