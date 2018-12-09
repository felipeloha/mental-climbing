import React, {
  Component
} from 'react';
import './ClimbMap.css';
import ReactMapboxGl, {
  ZoomControl,
  Marker,
  Layer,
  Feature,
  Popup
} from "react-mapbox-gl";


var request = require('request'),
  JSONStream = require('JSONStream');

const {
  token,
  styles
} = require('./config.json');

const
  MapBox = ReactMapboxGl({
    accessToken: token
  }),
  zoom = [5],
  center = [13.404954, 52.520008],
  mapStyleDefault = {
    width: '100%',
    height: '100%',
    left: 0
  };

export default class ClimbMap extends Component {
  constructor() {
    super();
    this.state = {
      mapContainer: {
        center: {
          lat: center[1],
          lng: center[0]
        }
      },
      markers: new Map(),
      selectedMarker: undefined
    };
    this.updateRoute = this.updateRoute.bind(this);
    this.updateRoutes = this.updateRoutes.bind(this);
  }

  updateRoute(route) {
    var markers = this.state.markers;
    var markerID = route.longitude + '-' + route.latitude;
    var marker = markers.get(markerID);

    //if there is a marker but no route
    if (
      marker &&
      marker.routes.filter(r => r.id === route.id).length === 0) {
      marker.routes.push(route);
    } else if (!marker) { //if there is no marker
      marker = {
        lat: route.latitude,
        lng: route.longitude,
        coordinates: [route.longitude, route.latitude],
        routes: [],
        id: markerID
      }

      marker.routes = [route];
      markers.set(markerID, marker);
    }

    this.setState({
      markers: markers
    });
  }

  markerClick(marker, {
    feature
  }: {
    feature: any
  }) {
    this.setState({
      center: feature.geometry.coordinates,
      zoom: [14],
      selectedMarker: marker
    });
  }

  onMoveEnd(_this, map) {
    if (map.getCenter()) {
      _this.setState({
        mapContainer: {
          center: {
            lat: map.getCenter().lat,
            lng: map.getCenter().lng
          }
        }
      });
    }
    this.updateRoutes();
  }

  onDrag() {
    if (this.state.selectedMarker) {
      this.setState({
        selectedMarker: undefined
      });
    }
  }

  updateRoutes() {
    var map = this.state.mapContainer;
    //var markers = this.state.markers;
    var url = 'https://www.mountainproject.com/data/get-routes-for-lat-lon?' +
      'lat=' + map.center.lat + '&' +
      'lon=' + map.center.lng + '&' +
      'maxDistance=' + 1000 + '&' +
      'key=200372954-0078fe17d58508600a5f342877aa43f3';
    //console.log("get url: ", url);

    //get routes and draw markers
    request.get(url)
      .on('error', function(err) {
        console.log('Error getting routes: ', err);
      })
      .pipe(JSONStream.parse('routes.*'))
      .on('data', (route) => this.updateRoute(route));
  }

  componentWillMount() {
    this.updateRoutes();
  }

  //TODO separate layer as own component
  //TODO: update map on zoom
  render() {
    const {
      markers,
      selectedMarker
    } = this.state;

    return (
      <MapBox
        style = {styles.outdoor}
        zoom = {zoom}
        onMoveEnd={map => this.onMoveEnd(this, map)}
        onZoom={this.onDrag.bind(this)}
        onDrag={this.onDrag.bind(this)}
        containerStyle = {mapStyleDefault}
        center = {center} >
          <ZoomControl/>
          <Marker coordinates={center}>
                      <div>MyCenter-{center}</div>
                  </Marker>
          <Layer
            type="symbol"
            layout={
              {
                "icon-image": "mountain-15",
                "icon-size": 1.75
              }}>
              {Array.from(markers).map(([id, marker], index) => {
                return <Feature
                          key={marker.id}
                          coordinates={marker.coordinates}
                          onClick={this.markerClick.bind(this, marker)}
                          />
              })}
          </Layer>

          {selectedMarker && (
          <Popup key={selectedMarker.id} coordinates={selectedMarker.coordinates}>
              <div className="styledPopUp">
                <div>{selectedMarker.id}</div>
                <div>
                  Routes: {selectedMarker.routes.length}<br/>
                  {selectedMarker.routes.map((route,index) => {
                    return <div key={route.id}>{route.name}</div>
                  })}
                </div>
              </div>
          </Popup>
        )}
      </MapBox>
    )
  }

}
