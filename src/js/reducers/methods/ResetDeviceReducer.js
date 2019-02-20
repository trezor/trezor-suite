/* @flow */

import { LOCATION_CHANGE } from 'connected-react-router';
import { FLAG_CHANGE } from '../../actions/methods/ResetDeviceActions';

type MethodState = {
    +js: string;
    +fields: Array<string>;

    label: string;
    //language: string;
    //strength: string;
    //u2fCounter: string;
    //random: boolean;
    pinProtection: boolean;
    passphraseProtection: boolean;
    skipBackup: boolean;
    noBackup: boolean;
}

const initialState: MethodState = {
    js: 'TrezorConnect.resetDevice',
    fields: ['label', 'pinProtection', 'passphraseProtection', 'skipBackup', 'noBackup'],

    label: '',
    //language: '',
    //strength: '',
    //u2fCounter: '',
    //random: false,
    pinProtection: false,
    passphraseProtection: false,
    skipBackup: false,
    noBackup: false,
};

export default function method(state: MethodState = initialState, action: any): any {

    switch (action.type) {

        case LOCATION_CHANGE :
            return initialState;

        case FLAG_CHANGE :
            return {
                ...state,
                ...action.flag
            };

        default:
            return state;
    }
}