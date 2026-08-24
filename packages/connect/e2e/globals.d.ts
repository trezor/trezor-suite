import type { CoinSymbol } from '@trezor/connect-common';

// Globals used in connect test
declare global {
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
        /** Coin symbols enabled (via `updateConnectSettings`) before the method call, merged
         *  on top of the test case's `enabledCoins`. Required for fixtures targeting a coin that
         *  Connect guards (e.g. `getAccountInfo({ coin: 'ada' })`), which it otherwise rejects
         *  with `Method_NetworkNotEnabled`. */
        enabledCoins?: readonly CoinSymbol[];
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
        // CI grouping id and suite title. Usually the method name; a variant needing its own group
        // uses a distinct id plus `apiMethod`.
        method: string;
        // TrezorConnect method to call; defaults to `method`.
        apiMethod?: string;
        /** Coin symbols enabled for every test in this case. Cardano fixtures set `['ada']`
         *  here so the whole file opts into Connect's guard; individual tests can add more via
         *  their own `enabledCoins`. */
        enabledCoins?: readonly CoinSymbol[];
        setup: {
            wiped?: boolean;
            mnemonic?: string;
            settings?: any;
        };
        tests: Fixture[];
    };
}
