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
        // If set, the screen content captured at ButtonRequest time is asserted
        // against this value. String → substring match (whitespace-normalized).
        // RegExp → match against normalized screen. Omit to skip capture entirely
        // (getScreenContent is a trezor-user-env round-trip; opt-in keeps unrelated
        // tests fast).
        deviceScreen?: string | RegExp;
        // Skip the deviceScreen assertion on matching matrices, using the same
        // rule syntax as `skip`/`legacyResults[].rules`. The fixture's API result
        // is still validated; only the screen check is suppressed. Use cases:
        // T1B1 (`getScreenContent` returns a placeholder), or old FW where the
        // displayed format differs (xpub vs raw pubkey, etc.).
        deviceScreenSkip?: string[];
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
