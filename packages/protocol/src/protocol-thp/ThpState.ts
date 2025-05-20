import { ThpCredentials, ThpDeviceProperties } from './messages';

export type ThpStateSerialized = {
    properties?: ThpDeviceProperties;
    credentials: ThpCredentials[];
};

export class ThpState {
    private _properties?: ThpDeviceProperties;
    private _pairingCredentials: ThpCredentials[] = [];

    get properties() {
        return this._properties;
    }

    setThpProperties(props: ThpDeviceProperties) {
        this._properties = props;
    }

    get pairingCredentials() {
        return this._pairingCredentials;
    }

    setPairingCredentials(credentials?: ThpCredentials[]) {
        if (credentials) {
            this._pairingCredentials.push(...credentials);
        } else {
            this._pairingCredentials = [];
        }
    }

    serialize(): ThpStateSerialized {
        return {
            properties: this._properties,
            credentials: this._pairingCredentials,
        };
    }
}
