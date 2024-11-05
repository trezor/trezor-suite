// eslint-disable-next-line @typescript-eslint/no-unused-vars
let Trezor: {
    getController: (testName?: string) => any;
    setup: (controller: any, options: any) => any;
    skipTest: (rules: any) => any;
    conditionalTest: (rules: any, ...args: any[]) => any;
    initTrezorConnect: (controller: any, options?: any) => any;
};
