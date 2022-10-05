/* eslint-disable no-var, vars-on-top */

// Globals used in connect test
declare namespace globalThis {
    var TestUtils: any;

    var firmware: string;
    var firmwareUrl: string | undefined;
    var firmwareArg: string | undefined;

    var Trezor: {
        getController: (testName?: string) => any;
        setup: (controller: any, options: any) => any;
        skipTest: (rules: any) => any;
        conditionalTest: (rules: any, ...args: any[]) => any;
        initTrezorConnect: (controller: any, options?: any) => any;
    };
}
