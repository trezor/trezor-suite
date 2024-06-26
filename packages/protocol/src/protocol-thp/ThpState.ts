import { ThpDeviceProperties } from './messages';

export type ThpStateSerialized = {
    properties?: ThpDeviceProperties;
};

export class ThpState {
    private _properties?: ThpDeviceProperties;

    get properties() {
        return this._properties;
    }

    setThpProperties(props: ThpDeviceProperties) {
        this._properties = props;
    }

    serialize(): ThpStateSerialized {
        return {
            properties: this._properties,
        };
    }
}
