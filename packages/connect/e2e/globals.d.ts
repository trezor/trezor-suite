// Globals used in connect test
declare namespace globalThis {
    // eslint-disable-next-line no-var, vars-on-top
    var Trezor: {
        firmware: string;
        getController: (testName?: string) => any;
        setup: (controller: any, options: any) => any;
        skipTest: (rules: any) => any;
        conditionalTest: (rules: any, ...args: any[]) => any;
        initTrezorConnect: (controller: any, options?: any) => any;
    };
    // eslint-disable-next-line no-var, vars-on-top
    var TestUtils: any;
}
