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
        getFirmwareRelease: typeof testMocks.getFirmwareRelease;
        getDeviceFeatures: typeof testMocks.getDeviceFeatures;
        getConnectDevice: typeof testMocks.getConnectDevice;
        getSuiteDevice: typeof testMocks.getSuiteDevice;
        getWalletAccount: typeof testMocks.getWalletAccount;
        getWalletTransaction: typeof testMocks.getWalletTransaction;
        getTrezorConnect: typeof testMocks.getTrezorConnect;
        getAnalytics: typeof testMocks.getAnalytics;
        getMessageSystemConfig: typeof testMocks.getMessageSystemConfig;
        getGuideNode: typeof testMocks.getGuideNode;
        intlMock: typeof testMocks.intlMock;
    };
}

global.JestMocks = {
    getFirmwareRelease: testMocks.getFirmwareRelease,
    getDeviceFeatures: testMocks.getDeviceFeatures,
    getConnectDevice: testMocks.getConnectDevice,
    getSuiteDevice: testMocks.getSuiteDevice,
    getWalletAccount: testMocks.getWalletAccount,
    getWalletTransaction: testMocks.getWalletTransaction,
    getTrezorConnect: testMocks.getTrezorConnect,
    getAnalytics: testMocks.getAnalytics,
    getMessageSystemConfig: testMocks.getMessageSystemConfig,
    getGuideNode: testMocks.getGuideNode,
    intlMock: testMocks.intlMock,
};

// @ts-expect-error
global.BroadcastChannel = BroadcastChannel;

// this helps with debugging - find unhandled promise rejections in jest

// process.on('unhandledRejection', (reason, p) => {
//     console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
// });
