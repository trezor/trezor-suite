/* eslint-disable no-var */

// Globals used in connect test
declare namespace globalThis {
    var TestUtils: any;

    var firmware: string;
    var firmwareUrl: string | undefined;
    var firmwareArg: string | undefined;
    var emulatorStartOpts: {
        version: string;
    };

    var Trezor: {
        getController: (testName?: string) => any;
        setup: (controller: any, options: any) => any;
        skipTest: (rules: any) => any;
        conditionalTest: (rules: any, ...args: any[]) => any;
        initTrezorConnect: (controller: any, options?: any) => any;
    };

    type LegacyResult = {
        rules: string[];
        payload?: any;
        success?: boolean;
    };

    type Fixture = {
        description: string;
        params: any;
        result?: any;
        legacyResults?: LegacyResult[];
        customTimeout?: number;
        setup?: any;
        skip?: any;
    };

    type TestCase = {
        // method: keyof typeof TrezorConnect;
        method: string;
        setup: {
            mnemonic?: string;
        };
        tests: Fixture[];
    };
}
