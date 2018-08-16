/*
https: //developers.google.com/maps/documentation/javascript/drawinglayer#overview
https: //developers.google.com/maps/documentation/javascript/shapes#rectangle_add
https: //developers.google.com/maps/documentation/javascript/reference/3.exp/drawing
https: //developers.google.com/maps/documentation/javascript/reference/3.exp/marker
https: //developers.google.com/maps/documentation/javascript/examples/rectangle-simple
https: //developers.google.com/maps/documentation/javascript/reference/3/coordinates#LatLngBounds
https: //developers.google.com/maps/documentation/javascript/examples/drawing-tools
https: //stackoverflow.com/questions/7983234/get-current-latlng-bounds
*/



// This example requires the Drawing library. Include the libraries=drawing
// parameter when you first load the API. For example:
// <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=drawing">

/*

HTML
< div id = "map" > < /div>
  <!-- Replace the value of the key parameter with your own API key. -->
  <
  script src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyCkUOdZ5y7hMm0yrcCQoCvLwzdM6M8s5qk&libraries=drawing&callback=initMap"
async defer > < /script>


CSS
#map {
  height: 100 %;
  width: 80 %;
}
html, body {
  height: 100 %;
  margin: 0;
  padding: 0;
}
*/
function initMap() {
  var map = new google.maps.Map(document.getElementById('map'), {
    center: {
      lat: -34.397,
      lng: 150.644
    },
    zoom: 8
  });

  var drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: google.maps.drawing.OverlayType.MARKER,
    drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_CENTER,
      drawingModes: ['circle', 'polygon', 'polyline', 'rectangle']
    },
    markerOptions: {
      icon: 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png'
    },
    circleOptions: {
      fillColor: '#ffff00',
      fillOpacity: 1,
      strokeWeight: 5,
      clickable: false,
      editable: true,
      zIndex: 1
    }
  });
  drawingManager.setMap(map);

  google.maps.event.addListener(drawingManager, 'overlaycomplete', function (e) {
    drawingManager.setDrawingMode(null);
    var newShape = e.overlay;
    newShape.type = e.type;
    if ([google.maps.drawing.OverlayType.POLYLINE, google.maps.drawing.OverlayType.POLYGON].indexOf(e.type) != -1) {
      // Switch back to non-drawing mode after drawing a shape.

      console.log(newShape);
      var paths = newShape.getPath();
      console.log(paths);
      console.log('--------');
      paths.forEach(function (item) {
        console.log("lat: " + item.lat() + "; lng: " + item.lng());
      });
      /* var area = google.maps.geometry.spherical.computeArea(newShape.getPath()) */
      ;
    }

    if ([google.maps.drawing.OverlayType.RECTANGLE, google.maps.drawing.OverlayType.CIRCLE].indexOf(e.type) != -1) {
      console.log(newShape);
      var bounds = newShape.getBounds();
      console.log(bounds);
      console.log(bounds.toJSON());
    }
  });

  var myPaths = [{
      lat: -34.092,
      lng: 149.424
    },
    {
      lat: -34.700,
      lng: 149.408
    },
    {
      lat: -34.731,
      lng: 150.319
    },
    {
      lat: -34.092,
      lng: 150.369
    },
    {
      lat: -34.092,
      lng: 149.424
    },
  ];

  var mySquare = new google.maps.Polyline({
    path: myPaths,
    fillColor: 'blue',
    fillOpacity: 1,
    strokeColor: 'green',
    strokeOpacity: 0.6,
    strokeWeight: 6,
    map: map,
  });

  var myBounds = {
    south: -34.584893241671324,
    west: 148.3148984375,
    north: -34.40379869327019,
    east: 148.6664609375
  }

  var myRectangle = new google.maps.Rectangle({
    strokeColor: '#FF0000',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#FF0000',
    fillOpacity: 0.35,
    map: map,
    bounds: myBounds
  });

}


// https://stackoverflow.com/questions/12671077/calculate-area-of-a-drawn-polygon-on-google-map-javascript

var drawingManager;
var selectedShape;
var colors = ['#1E90FF', '#FF1493', '#32CD32', '#FF8C00', '#4B0082'];
var selectedColor;
var colorButtons = {};

function clearSelection() {
  if (selectedShape) {
    selectedShape.setEditable(false);
    selectedShape = null;
  }
}

function setSelection(shape) {
  clearSelection();
  selectedShape = shape;
  shape.setEditable(true);
  selectColor(shape.get('fillColor') || shape.get('strokeColor'));
  google.maps.event.addListener(shape.getPath(), 'set_at', calcar);
  google.maps.event.addListener(shape.getPath(), 'insert_at', calcar);
}

function calcar() {
  var area = google.maps.geometry.spherical.computeArea(selectedShape.getPath());
  document.getElementById("area").innerHTML = "Area =" + area;
}

function deleteSelectedShape() {
  if (selectedShape) {
    selectedShape.setMap(null);
  }
}

function selectColor(color) {
  selectedColor = color;
  for (var i = 0; i < colors.length; ++i) {
    var currColor = colors[i];
    colorButtons[currColor].style.border = currColor == color ? '2px solid #789' : '2px solid #fff';
  }

  // Retrieves the current options from the drawing manager and replaces the
  // stroke or fill color as appropriate.
  var polylineOptions = drawingManager.get('polylineOptions');
  polylineOptions.strokeColor = color;
  drawingManager.set('polylineOptions', polylineOptions);

  var rectangleOptions = drawingManager.get('rectangleOptions');
  rectangleOptions.fillColor = color;
  drawingManager.set('rectangleOptions', rectangleOptions);

  var circleOptions = drawingManager.get('circleOptions');
  circleOptions.fillColor = color;
  drawingManager.set('circleOptions', circleOptions);

  var polygonOptions = drawingManager.get('polygonOptions');
  polygonOptions.fillColor = color;
  drawingManager.set('polygonOptions', polygonOptions);
}

function setSelectedShapeColor(color) {
  if (selectedShape) {
    if (selectedShape.type == google.maps.drawing.OverlayType.POLYLINE) {
      selectedShape.set('strokeColor', color);
    } else {
      selectedShape.set('fillColor', color);
    }
  }
}

function makeColorButton(color) {
  var button = document.createElement('span');
  button.className = 'color-button';
  button.style.backgroundColor = color;
  google.maps.event.addDomListener(button, 'click', function () {
    selectColor(color);
    setSelectedShapeColor(color);
  });

  return button;
}

function buildColorPalette() {
  var colorPalette = document.getElementById('color-palette');
  for (var i = 0; i < colors.length; ++i) {
    var currColor = colors[i];
    var colorButton = makeColorButton(currColor);
    colorPalette.appendChild(colorButton);
    colorButtons[currColor] = colorButton;
  }
  selectColor(colors[0]);
}

function initialize() {
  var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 10,
    center: new google.maps.LatLng(22.344, 114.048),
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    disableDefaultUI: true,
    zoomControl: true
  });

  var polyOptions = {
    strokeWeight: 0,
    fillOpacity: 0.45,
    editable: true
  };
  // Creates a drawing manager attached to the map that allows the user to draw
  // markers, lines, and shapes.
  drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: google.maps.drawing.OverlayType.POLYGON,
    markerOptions: {
      draggable: true
    },
    polylineOptions: {
      editable: true
    },
    rectangleOptions: polyOptions,
    circleOptions: polyOptions,
    polygonOptions: polyOptions,
    map: map
  });

  google.maps.event.addListener(drawingManager, 'overlaycomplete', function (e) {
    if (e.type != google.maps.drawing.OverlayType.MARKER) {
      // Switch back to non-drawing mode after drawing a shape.
      drawingManager.setDrawingMode(null);

      // Add an event listener that selects the newly-drawn shape when the user
      // mouses down on it.
      var newShape = e.overlay;
      newShape.type = e.type;
      google.maps.event.addListener(newShape, 'click', function () {
        setSelection(newShape);
      });
      var area = google.maps.geometry.spherical.computeArea(newShape.getPath());
      document.getElementById("area").innerHTML = "Area =" + area;
      setSelection(newShape);
    }
  });

  // Clear the current selection when the drawing mode is changed, or when the
  // map is clicked.
  google.maps.event.addListener(drawingManager, 'drawingmode_changed', clearSelection);
  google.maps.event.addListener(map, 'click', clearSelection);
  google.maps.event.addDomListener(document.getElementById('delete-button'), 'click', deleteSelectedShape);

  buildColorPalette();
}
google.maps.event.addDomListener(window, 'load', initialize);
