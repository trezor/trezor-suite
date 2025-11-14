/* eslint-disable no-var */

// Globals used in connect test
declare namespace globalThis {
    var TestUtils: any;

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
        setup?: {
            wiped?: boolean;
            mnemonic?: string;
            settings?: any;
        };
        skip?: any;
    };

    type TestCase = {
        // method: keyof typeof TrezorConnect;
        method: string;
        setup: {
            wiped?: boolean;
            mnemonic?: string;
            settings?: any;
        };
        tests: Fixture[];
    };
}
