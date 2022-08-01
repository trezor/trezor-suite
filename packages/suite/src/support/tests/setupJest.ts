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
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace NodeJS {
        interface Global {
            JestMocks: {
                getFirmwareRelease: typeof testMocks.getFirmwareRelease;
                getDeviceFeatures: typeof testMocks.getDeviceFeatures;
                getConnectDevice: typeof testMocks.getConnectDevice;
                getSuiteDevice: typeof testMocks.getSuiteDevice;
                getWalletAccount: typeof testMocks.getWalletAccount;
                getWalletTransaction: typeof testMocks.getWalletTransaction;
                getTrezorConnect: typeof testMocks.getTrezorConnect;
                getMessageSystemConfig: typeof testMocks.getMessageSystemConfig;
                getGuideNode: typeof testMocks.getGuideNode;
                intlMock: typeof testMocks.intlMock;
            };
            BroadcastChannel: typeof BroadcastChannel;
        }
    }
}

global.JestMocks = {
    getFirmwareRelease: testMocks.getFirmwareRelease,
    getDeviceFeatures: testMocks.getDeviceFeatures,
    getConnectDevice: testMocks.getConnectDevice,
    getSuiteDevice: testMocks.getSuiteDevice,
    getWalletAccount: testMocks.getWalletAccount,
    getWalletTransaction: testMocks.getWalletTransaction,
    getTrezorConnect: testMocks.getTrezorConnect,
    getMessageSystemConfig: testMocks.getMessageSystemConfig,
    getGuideNode: testMocks.getGuideNode,
    intlMock: testMocks.intlMock,
};

// @ts-ignore
global.BroadcastChannel = BroadcastChannel;

// this helps with debugging - find unhandled promise rejections in jest

// process.on('unhandledRejection', (reason, p) => {
//     console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
// });
