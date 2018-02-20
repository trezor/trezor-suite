/* @flow */
'use strict';

import { ON_RESIZE, TOGGLE_DEVICE_DROPDOWN, RESIZE_CONTAINER } from '../actions/AppActions';
import * as WEB3 from '../actions/constants/Web3';

const WIDTH: number = 1080;
const HEIGHT: number = 1920;

const initialState: Object = {
    orginalWidth: WIDTH,
    orginalHeight: HEIGHT,
    width: window.innerWidth,
    height: window.innerHeight,
    scale: Math.min(window.innerWidth / WIDTH, window.innerHeight / HEIGHT),
    coinDropdownOpened: false,
    deviceDropdownOpened: false,
    initialized: false,
    landingPage: true,
};

export default function DOM(state: Object = initialState, action: Object): any {
    switch(action.type) {
        case ON_RESIZE :
            return {
                ...state,
                scale: Math.min(window.innerWidth / WIDTH, window.innerHeight / HEIGHT),
            }
        case RESIZE_CONTAINER :
            return {
                ...state,
                coinDropdownOpened: action.opened
            }
        case TOGGLE_DEVICE_DROPDOWN :
            return {
                ...state,
                deviceDropdownOpened: action.opened
            }

        case WEB3.READY :
            return {
                ...state,
                initialized: true
            }
        
        default:
            return state;
    }
}
