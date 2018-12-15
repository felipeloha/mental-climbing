import React, {
    Component
} from 'react';

import './ClimbMap.css';

import Crags from '../Crags/Crags'

import ReactMapboxGl, {
    ZoomControl,
    Marker,
    Layer,
    Feature,
    Popup
} from "react-mapbox-gl";


let request = require('request'),
    JSONStream = require('JSONStream');

const {
    token,
    styles,
    mountainProjectAPIKey,
    mountainMaxDistance,
    positions
} = require('./config.json');

const
    MapBox = ReactMapboxGl({
        accessToken: token
    }),
    zoom = [5],
    center = positions.berlin,
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
        if (marker &&
            marker.routes.filter(r => r.id === route.id).length === 0) {

            marker.routes.push(route);

            //if there is no marker
        } else if (!marker) {
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

    markerClick(marker, {feature}: { feature: any }) {
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
        let map = this.state.mapContainer;
        let url = 'https://www.mountainproject.com/data/get-routes-for-lat-lon?' +
            'lat=' + map.center.lat + '&' +
            'lon=' + map.center.lng + '&' +
            'maxDistance=' + mountainMaxDistance + '&' +
            'key=' + mountainProjectAPIKey;

        //get routes and draw markers
        request.get(url)
            .on('error', function (err) {
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
    //TODO: pointer on enter icon
    //TODO: unit tests
    render() {
        const {
            center,
            markers,
            selectedMarker
        } = this.state;

        return (
            <MapBox
                style={styles.outdoor}
                zoom={zoom}
                onMoveEnd={map => this.onMoveEnd(this, map)}
                onZoom={this.onDrag.bind(this)}
                onDrag={this.onDrag.bind(this)}
                containerStyle={mapStyleDefault}
                center={center}>

                <ZoomControl/>

                <Marker coordinates={center}>
                    <div>MyCenter-{center}</div>
                </Marker>

                <Crags
                    center={center}
                    markers={markers}
                    selectedMarker={selectedMarker}/>
            </MapBox>
        )
    }

}
