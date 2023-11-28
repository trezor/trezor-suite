import { testMocks } from '@suite-common/test-utils';

const { getSuiteDevice } = testMocks;

export const paramsError = (error: string, code?: string) => ({
    success: false,
    payload: {
        error,
        code,
    },
});

export const fixtures = [
    {
        description: 'All accounts are empty',
        connect: {
            success: true,
            interruption: ['only-for-type-correctness'],
        },
        result: {
            failed: [],
        },
    },
    {
        description: 'Few accounts are not empty',
        connect: {
            success: true,
            usedAccounts: ["m/44'/0'/1'", "m/49'/0'/2'", "m/49'/2'/3'"],
        },
        result: {
            failed: [],
        },
    },
    {
        description: 'Few accounts failed on runtime',
        connect: {
            success: true,
            usedAccounts: ["m/44'/0'/1'", "m/49'/0'/2'", "m/44'/1'/3'"],
            failedAccounts: ["m/84'/0'/0'", "m/49'/0'/1'", "m/44'/1'/3'"],
        },
        result: {
            failed: [
                {
                    error: 'Runtime discovery error',
                    index: 0,
                    symbol: 'btc',
                    accountType: 'normal',
                },
                {
                    error: 'Runtime discovery error',
                    index: 1,
                    symbol: 'btc',
                    accountType: 'segwit',
                },
                {
                    error: 'Runtime discovery error',
                    index: 3,
                    symbol: 'test',
                    accountType: 'legacy',
                },
            ],
        },
    },
    {
        description: 'Account beyond the limit (10)',
        connect: {
            success: true,
            usedAccounts: ["m/44'/0'/20'"],
        },
        result: {
            failed: [],
        },
    },
    {
        description: 'First iteration btc account error',
        connect: {
            error: {
                error: '[{"index":0,"coin":"btc","exception":"Btc not supported"}]',
                code: 'Method_Discovery_BundleException',
            },
            success: true,
        },
        result: {
            failed: [
                {
                    error: 'Btc not supported',
                    fwException: 'Btc not supported',
                    index: 0,
                    symbol: 'btc',
                    accountType: 'normal',
                },
            ],
        },
    },
    {
        description: 'First iteration multiple accounts error (taproot disabled)',
        connect: {
            error: {
                error: JSON.stringify([
                    {
                        index: 1,
                        coin: 'btc',
                        exception: 'Btc p2sh not supported',
                    },
                    {
                        index: 5,
                        coin: 'test',
                        exception: 'Testnet legacy not supported',
                    },
                ]),
                code: 'Method_Discovery_BundleException',
            },
            success: true,
        },
        device: getSuiteDevice({
            state: 'device-state',
            connected: true,
            unavailableCapabilities: { taproot: 'update-required' },
        }),
        result: {
            failed: [
                {
                    error: 'Btc p2sh not supported',
                    fwException: 'Btc p2sh not supported',
                    index: 0,
                    symbol: 'btc',
                    accountType: 'segwit',
                },
                {
                    error: 'Testnet legacy not supported',
                    fwException: 'Testnet legacy not supported',
                    index: 0,
                    symbol: 'test',
                    accountType: 'legacy',
                },
            ],
        },
    },
    {
        description: 'First iteration other error',
        connect: {
            error: {
                error: 'Other error',
                code: undefined,
            },
        },
        // this device is used only to cover missing unavailableCapabilities case
        device: getSuiteDevice({
            type: 'unacquired',
        }),
    },
    {
        description: 'UnavailableCapability: XRP, discovery empty',
        connect: {
            success: true,
        },
        device: getSuiteDevice({
            state: 'device-state',
            connected: true,
            unavailableCapabilities: { xrp: 'no-capability' },
        }),
        enabledNetworks: ['xrp'],
        result: {
            failed: [],
        },
    },
    {
        description: 'UnavailableCapability: XRP, discovery not empty',
        connect: {
            success: true,
        },
        device: getSuiteDevice({
            state: 'device-state',
            connected: true,
            unavailableCapabilities: { xrp: 'no-capability' },
        }),
        enabledNetworks: ['btc', 'xrp'],
        result: {
            failed: [],
        },
    },
];

// Trigger is called from test after account creation (TrezorConnect progress event)
// since TrezorConnect.cancel is an async method it will be resolved later, even after few more "progress events"
// If mocked TrezorConnect is requested for a next account which was found in fixture "connect.interruption" field it will throw "discovery_interrupted" error
// To understand this logic here's a simplified description based on 'Multiple interruptions' test:
// 1. TrezorConnect.getAccountInfo received first bundle: ["m/84'/0'/0'", "m/49'/0'/0'", "m/44'/0'/0'"....]
// 2. Account "m/84'/0'/0'" is emitted by TrezorConnect progress event and account is created in reducer
// 3. ACCOUNT.CREATE action is captured by test and its path is matching the first item in "trigger" field, Discovery.stop() is called
// 4. Discovery process has now status = DISCOVERY.STOPPING, from now on it will ignore any progress event until TrezorConnect return response (success = false)
// 5. Returned error from TrezorConnect has a "discovery_interrupted" error. Discovery process status in now = DISCOVERY.STOPPED
// 6. Since test captured DISCOVERY.STOP action and previous actions (DISCOVERY.INTERRUPTED) was present, test will start new iteration (restart discovery)
// 7. TrezorConnect.getAccountInfo received a second bundle. Account "m/84'/0'/0'" is already created so bundle starts with "m/84'/0'/1'" and is followed by missing accounts: "m/49'/0'/0'", "m/44'/0'/0'"...
// 8. Second bundle is completed without interruption. Created accounts: ["m/84'/0'/0'", "m/84'/0'/1'", "m/49'/0'/0'", "m/44'/0'/0'"....], Discovery process requests for another bundle.
// 9. TrezorConnect.getAccountInfo received third bundle. Bundle starts with ["m/84'/0'/2'", "m/49'/0'/1'", "m/44'/0'/1'"...]
// 10. Account "m/84'/0'/2'" is created in reducer, interruption is triggered from test, TrezorConnect is requested for "m/49'/0'/1'" and throws error...
// ...and so on, until discovery calls completeDiscovery action
export const interruptionFixtures = [
    {
        description:
            'Interruption triggered after 1st account, rejected error from TrezorConnect after 3rd account',
        connect: {
            success: true,
            interruption: ["m/44'/0'/0'"],
        },
        trigger: ["m/84'/0'/0'"],
    },
    {
        description: 'Interruption triggered in third bundle',
        connect: {
            success: true,
            usedAccounts: ["m/44'/0'/4'", "m/49'/0'/4'", "m/49'/2'/4'"],
            interruption: ["m/44'/0'/2'"],
        },
        trigger: ["m/49'/0'/2'"],
    },
    {
        description: 'Multiple interruptions',
        connect: {
            success: true,
            usedAccounts: ["m/84'/0'/4'", "m/49'/0'/4'", "m/44'/0'/4'"],
            interruption: ["m/49'/0'/0'", "m/49'/0'/1'", "m/44'/0'/1'", "m/44'/0'/2'"],
        },
        trigger: ["m/84'/0'/0'", "m/84'/0'/2'", "m/49'/0'/1'", "m/49'/0'/3'"],
    },
    {
        description:
            'Last account discovered, results from @trezor/connect are ok, but discovery is expecting interruption',
        connect: {
            success: true,
        },
        trigger: ["m/44'/1'/0'"],
    },
];

// Discovery process can be modified when running
export const changeNetworksFixtures = [
    {
        description: 'Enable LTC after 1st account',
        connect: {
            success: true,
        },
        trigger: [
            {
                path: "m/84'/0'/0'",
                networks: ['btc', 'ltc', 'test'],
            },
        ],
    },
    {
        description: 'Disable TEST after 1st account',
        connect: {
            success: true,
            usedAccounts: ["m/84'/0'/4'"],
        },
        trigger: [
            {
                path: "m/84'/0'/0'",
                networks: ['btc'],
            },
        ],
    },
    {
        description: 'Enable LTC in third bundle',
        connect: {
            success: true,
            usedAccounts: ["m/84'/0'/4'", "m/49'/0'/4'", "m/44'/0'/4'"],
        },
        trigger: [
            {
                path: "m/84'/0'/2'",
                networks: ['btc', 'ltc', 'test'],
            },
        ],
    },
    {
        description: 'Enable LTC + disable TEST in third bundle',
        connect: {
            success: true,
            usedAccounts: ["m/84'/0'/4'"],
        },
        trigger: [
            {
                path: "m/84'/0'/2'",
                networks: ['btc', 'ltc'],
            },
        ],
    },
];

export const unavailableCapabilities = [
    {
        description: 'UnavailableCapability: Enable XRP',
        device: getSuiteDevice({
            state: 'device-state',
            connected: true,
            unavailableCapabilities: { xrp: 'no-capability', taproot: 'no-support' },
        }),
        networks: ['btc', 'xrp'],
        discoveryNetworks: ['btc', 'btc', 'btc'],
    },
    {
        description: 'UnavailableCapability: Only LTC',
        device: getSuiteDevice({
            state: 'device-state',
            connected: true,
            unavailableCapabilities: { ltc: 'no-capability' },
        }),
        networks: ['ltc'],
        discoveryNetworks: [],
    },
    {
        description: 'UnavailableCapability: Device without features',
        // this device is used only to cover missing unavailableCapabilities case
        device: getSuiteDevice({
            type: 'unacquired',
        }),
        networks: ['xrp'],
        discoveryNetworks: ['xrp'],
    },
];
