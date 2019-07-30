import { ON_RESIZE } from '../actions/DOMActions';

const WIDTH = 1080;
const HEIGHT = 1920;

interface State {
    originalWidth: number;
    originalHeight: number;
    width: number;
    height: number;
    scale: number;
}

const initialState: State = {
    orginalWidth: WIDTH,
    orginalHeight: HEIGHT,
    width: window.innerWidth,
    height: window.innerHeight,
    scale: Math.min(window.innerWidth / WIDTH, window.innerHeight / HEIGHT),
};

export default function DOM(state: State = initialState, action) {
    switch (action.type) {
        case ON_RESIZE:
            return {
                ...state,
                scale: Math.min(window.innerWidth / WIDTH, window.innerHeight / HEIGHT),
            };
        default:
            return state;
    }
}
