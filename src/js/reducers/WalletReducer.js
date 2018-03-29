/* @flow */
'use strict';

import { ON_RESIZE, TOGGLE_DEVICE_DROPDOWN, RESIZE_CONTAINER } from '../actions/AppActions';
import * as WEB3 from '../actions/constants/Web3';

const WIDTH: number = 1080;
const HEIGHT: number = 1920;

type State = {
    network: string;
    device: string;

}

const initialState: Object = {

};

export default function wallet(state: Object = initialState, action: Object): any {
    switch(action.type) {

        
        default:
            return state;
    }
}
