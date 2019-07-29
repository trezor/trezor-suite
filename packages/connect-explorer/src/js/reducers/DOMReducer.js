/* @flow */
'use strict';

import { ON_RESIZE } from '../actions/DOMActions';

const WIDTH: number = 1080;
const HEIGHT: number = 1920;

const initialState: Object = {
    orginalWidth: WIDTH,
    orginalHeight: HEIGHT,
    width: window.innerWidth,
    height: window.innerHeight,
    scale: Math.min(window.innerWidth / WIDTH, window.innerHeight / HEIGHT),
};

export default function DOM(state: Object = initialState, action: Object): void {
    switch(action.type) {
        case ON_RESIZE :
            return {
                ...state,
                scale: Math.min(window.innerWidth / WIDTH, window.innerHeight / HEIGHT),
            }
        default:
            return state;
    }
}
