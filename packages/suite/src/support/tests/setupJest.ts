import { testMocks } from '@suite-common/test-utils';

class BroadcastChannel {
    name: string;
    constructor(name: string) {
        this.name = name;
    }

    get onmessage() {
        return undefined;
    } // getter method
    set onmessage(_handler) {
        // do nothing
    }

    postMessage = (_message: any) => {
        // do nothing
    };
}

declare global {
    // eslint-disable-next-line no-var, vars-on-top
    var JestMocks: {
        getTrezorConnect: typeof testMocks.getTrezorConnect;
    };
}

global.JestMocks = {
    getTrezorConnect: testMocks.getTrezorConnect,
};

// @ts-expect-error
global.BroadcastChannel = BroadcastChannel;

// this helps with debugging - find unhandled promise rejections in jest

// process.on('unhandledRejection', (reason, p) => {
//     console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
// });
