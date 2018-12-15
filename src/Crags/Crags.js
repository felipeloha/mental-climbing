import React, {
    Component
} from 'react';

import './Crags.css';

import {
    Layer,
    Feature,
    Popup
} from "react-mapbox-gl";

export default class Crags extends Component {

    constructor(props) {
        console.log("props:",props)
        super(props);
        this.state = {
            markers: props.markers,
            selectedMarker: props.selectedMarker
        };
    }


    markerClick(marker, {feature}: { feature: any }) {
        this.setState({
            center: feature.geometry.coordinates,
            zoom: [14],
            selectedMarker: marker
        });
    }

    render() {
        const {
            markers,
            selectedMarker
        } = this.state;

        return (
            <Layer
                type="symbol"
                layout={{
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

                {selectedMarker && (
                    <Popup key={selectedMarker.id} coordinates={selectedMarker.coordinates}>
                        <div className="styledPopUp">
                            <div>{selectedMarker.id}</div>
                            <div>
                                Routes: {selectedMarker.routes.length}<br/>
                                {selectedMarker.routes.map((route, index) => {
                                    return <div key={route.id}>{route.name}</div>
                                })}
                            </div>
                        </div>
                    </Popup>
                )}
            </Layer>
        );
    }

}