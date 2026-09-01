import { compose } from 'redux';

declare global {
    interface Window {
        __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
        electronFind: {
            onShow: (callback: () => void) => void;
            offShow: (callback: () => void) => void;
        };
    }
}

export {};
