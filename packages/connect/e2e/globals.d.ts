 

import type { ApplySettings } from '@trezor/protobuf/src/messages-schema';

// Globals used in connect test
declare global {
    var TestUtils: {
        TX_CACHE: (txs: string[], force?: boolean) => Record<string, unknown>[];
    };

    var firmware: string;
    var firmwareUrl: string | undefined;
    var firmwareArg: string | undefined;
    var emulatorStartOpts: {
        version: string;
        model: 'T1B1' | 'T2T1' | 'T3B1' | 'T3T1';
    };

    type LegacyResult = {
        rules: string[];
        payload?: Record<string, unknown> | boolean;
        success?: boolean;
    };

    type Fixture = {
        description: string;
        params: Record<string, unknown>;
        result?: Record<string, unknown> | Record<string, unknown>[] | boolean;
        legacyResults?: LegacyResult[];
        customTimeout?: number;
        setup?: {
            wiped?: boolean;
            mnemonic?: string;
            settings?: ApplySettings;
        };
        skip?: string[];
    };

    type TestCase = {
        // method: keyof typeof TrezorConnect;
        method: string;
        setup: {
            wiped?: boolean;
            mnemonic?: string;
            settings?: ApplySettings;
        };
        tests: Fixture[];
    };
}

export {};
