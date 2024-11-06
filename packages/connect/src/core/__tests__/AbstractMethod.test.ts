import { DeviceModelInternal, FirmwareRange, CoinInfo } from '../../exports';
import { DEFAULT_FIRMWARE_RANGE as DEFAULT_RANGE } from '../AbstractMethod';

const DEFAULT_COIN_INFO: CoinInfo = {
    support: {
        T1B1: '1.6.2',
        T2T1: '2.1.0',
        T2B1: '2.6.2',
        T3B1: '2.8.2',
        T3T1: '2.7.2',
        T3W1: '2.7.2',
    },
    shortcut: 'btc',
    type: 'bitcoin',
} as CoinInfo;

const EMPTY_CONFIG = {
    supportedFirmware: [],
};

const rangeFromCoinInfo = (
    Object.entries(DEFAULT_COIN_INFO.support) as [DeviceModelInternal, string][]
).reduce((acc, [model]) => {
    acc[model] = {
        // @ts-expect-error
        min: DEFAULT_COIN_INFO.support[model],
        max: '0',
    };

    return acc;
}, {} as FirmwareRange);

type Fixture = {
    description: string;
    config?: any;
    params: [string, Partial<CoinInfo> | null];
    result: FirmwareRange;
};

const getFirmwareRange: Fixture[] = [
    {
        description: 'default range. coinInfo and config.ts data not found',
        config: EMPTY_CONFIG,
        params: ['signTransaction', null],
        result: DEFAULT_RANGE,
    },
    {
        description: 'range from coinInfo',
        config: EMPTY_CONFIG,
        params: ['signTransaction', DEFAULT_COIN_INFO],
        result: rangeFromCoinInfo,
    },
    {
        description: 'coinInfo without support',
        config: EMPTY_CONFIG,
        params: ['signTransaction', { shortcut: 'btc', type: 'bitcoin' }],
        result: (Object.keys(DEFAULT_COIN_INFO.support) as DeviceModelInternal[]).reduce(
            (acc, model) => {
                acc[model] = { min: '0', max: '0' };

                return acc;
            },
            {} as FirmwareRange,
        ),
    },
    {
        description: 'coinInfo without T1B1 support',
        config: EMPTY_CONFIG,
        params: [
            'signTransaction',
            {
                support: {
                    ...DEFAULT_COIN_INFO.support,
                    T1B1: false,
                },
                shortcut: 'btc',
                type: 'bitcoin',
            },
        ],
        result: (
            Object.entries(DEFAULT_COIN_INFO.support) as [DeviceModelInternal, string][]
        ).reduce((acc, [model, min]) => {
            acc[model] = { min: model === 'T1B1' ? '0' : min, max: '0' };

            return acc;
        }, {} as FirmwareRange),
    },
    {
        description: 'coinInfo without T2 support',
        config: EMPTY_CONFIG,
        params: [
            'signTransaction',
            {
                support: {
                    ...DEFAULT_COIN_INFO.support,
                    T2T1: false,
                    T2B1: false,
                    T3B1: false,
                    T3T1: false,
                    T3W1: false,
                },
                shortcut: 'btc',
                type: 'bitcoin',
            },
        ],
        result: (
            Object.entries(DEFAULT_COIN_INFO.support) as [DeviceModelInternal, string][]
        ).reduce((acc, [model, min]) => {
            acc[model] = { min: model === 'T1B1' ? min : '0', max: '0' };

            return acc;
        }, {} as FirmwareRange),
    },

    {
        description: 'range from config.ts (by coinType and coin as string)',
        config: {
            supportedFirmware: [
                // this one is ignored, different excludedMethod
                {
                    coinType: 'bitcoin',
                    methods: ['showAddress'],
                    min: { T1B1: '1.12.0', T2T1: '2.6.0' },
                },
                // should merge both of these ranges together, since they both match
                { coinType: 'bitcoin', min: { T1B1: '1.10.0', T2T1: '2.5.0' } },
                { coin: 'btc', min: { T1B1: '1.11.0', T2T1: '2.4.0' } },
            ],
        },
        params: ['signTransaction', DEFAULT_COIN_INFO],
        result: {
            ...rangeFromCoinInfo,
            T1B1: { min: '1.11.0', max: '0' },
            T2T1: { min: '2.5.0', max: '0' },
        },
    },

    {
        description: 'range from config.ts (by coin as string)',
        config: {
            supportedFirmware: [
                // this one is ignored, different excludedMethod
                { coin: 'btc', methods: ['showAddress'], min: { T1B1: '1.11.0', T2T1: '2.5.0' } },
                { coin: 'btc', min: { T1B1: '1.10.0', T2T1: '2.4.0' } },
            ],
        },
        params: ['signTransaction', DEFAULT_COIN_INFO],
        result: {
            ...rangeFromCoinInfo,
            T1B1: { min: '1.10.0', max: '0' },
            T2T1: { min: '2.4.0', max: '0' },
        },
    },
    {
        description: 'range from config.ts (by coin as array)',
        config: {
            supportedFirmware: [
                // this one is ignored, different excludedMethod
                { coin: ['btc'], methods: ['showAddress'], min: { T1B1: '1.11.0', T2T1: '2.5.0' } },
                { coin: ['btc'], min: { T1B1: '1.10.0', T2T1: '2.4.0' } },
            ],
        },
        params: ['signTransaction', DEFAULT_COIN_INFO],
        result: {
            ...rangeFromCoinInfo,
            T1B1: { min: '1.10.0', max: '0' },
            T2T1: { min: '2.4.0', max: '0' },
        },
    },
    {
        description: 'range from config.ts (by methods)',
        config: {
            supportedFirmware: [
                // this one is ignored, no data
                { min: { T1B1: '1.11.0', T2T1: '2.5.0' } },
                // this one is ignored, different excludedMethod
                { coin: ['btc'], methods: ['showAddress'], min: { T1B1: '1.11.0', T2T1: '2.5.0' } },
                // this one is ignored because of coin (not btc)
                {
                    coin: ['ltc'],
                    methods: ['signTransaction'],
                    min: { T1B1: '1.11.0', T2T1: '2.5.0' },
                },
                // this one is ignored, different excludedMethod
                {
                    coinType: 'bitcoin',
                    methods: ['showAddress'],
                    min: { T1B1: '1.11.0', T2T1: '2.5.0' },
                },
                { methods: ['signTransaction'], min: { T1B1: '1.10.0', T2T1: '2.4.0' } },
            ],
        },
        params: ['signTransaction', DEFAULT_COIN_INFO],
        result: {
            ...rangeFromCoinInfo,
            T1B1: { min: '1.10.0', max: '0' },
            T2T1: { min: '2.4.0', max: '0' },
        },
    },
    {
        description: 'range from config.ts (by capabilities)',
        config: {
            supportedFirmware: [
                // this one is ignored, no data
                { min: { T1B1: '1.11.0', T2T1: '2.5.0' } },
                // this one is ignored, different excludedMethod
                { coin: ['btc'], methods: ['showAddress'], min: { T1B1: '1.11.0', T2T1: '2.5.0' } },
                // this one is ignored because of coin (not btc)
                {
                    coin: ['ltc'],
                    methods: ['signTransaction'],
                    min: { T1B1: '1.11.0', T2T1: '2.5.0' },
                },
                // this one is ignored, different excludedMethod
                {
                    coinType: 'bitcoin',
                    methods: ['showAddress'],
                    min: { T1B1: '1.11.0', T2T1: '2.5.0' },
                },
                { capabilities: ['decreaseOutput'], min: { T1B1: '1.10.0', T2T1: '2.4.0' } },
            ],
        },
        params: ['decreaseOutput', DEFAULT_COIN_INFO],
        result: {
            ...rangeFromCoinInfo,
            T1B1: { min: '1.10.0', max: '0' },
            T2T1: { min: '2.4.0', max: '0' },
        },
    },
    {
        description: 'range from config.ts is lower than coinInfo',
        config: {
            supportedFirmware: [
                { methods: ['signTransaction'], min: { T1B1: '1.6.2', T2T1: '2.1.0' } },
            ],
        },
        params: [
            'signTransaction',
            {
                // @ts-expect-error
                support: { T1B1: '1.10.0', T2T1: '2.4.0' },
                shortcut: 'btc',
                type: 'bitcoin',
            },
            DEFAULT_RANGE,
        ],
        result: {
            ...DEFAULT_RANGE,
            T1B1: { min: '1.10.0', max: '0' },
            T2T1: { min: '2.4.0', max: '0' },
        },
    },
    {
        description: 'range from config.ts using max',
        config: {
            supportedFirmware: [
                { methods: ['signTransaction'], max: { T1B1: '1.10.0', T2T1: '2.4.0' } },
            ],
        },
        params: ['signTransaction', DEFAULT_COIN_INFO],
        result: {
            ...rangeFromCoinInfo,
            T1B1: { min: '1.6.2', max: '1.10.0' },
            T2T1: { min: '2.1.0', max: '2.4.0' },
        },
    },

    // real config.ts data
    {
        description: 'xrp + getAccountInfo: coinInfo range IS replaced by config.ts range',
        params: [
            'getAccountInfo',
            {
                // @ts-expect-error
                support: { T1B1: '1.0.1', T2T1: '2.0.1' },
                shortcut: 'xrp',
                type: 'misc',
            },
            DEFAULT_RANGE,
        ],
        result: {
            ...DEFAULT_RANGE,
            T1B1: { min: '0', max: '0' },
            T2T1: { min: '2.1.0', max: '0' },
        },
    },
    {
        description: 'btc + getAccountInfo: coinInfo range IS NOT replaced by config.ts range',
        params: ['getAccountInfo', null],
        result: DEFAULT_RANGE,
    },
    {
        description: 'eip1559: coinInfo range is replaced by config.ts range',
        params: [
            'eip1559',
            {
                support: {
                    ...DEFAULT_COIN_INFO.support,
                    T1B1: '1.6.2',
                    T2T1: '2.1.0',
                },
                shortcut: 'eth',
                type: 'ethereum',
            },
        ],
        result: {
            ...rangeFromCoinInfo,
            T1B1: { min: '1.10.4', max: '0' },
            T2T1: { min: '2.4.2', max: '0' },
        },
    },
    {
        description: 'method not available for T1B1 and T2T1, defined by config',
        params: ['authenticateDevice', null],
        result: {
            ...DEFAULT_RANGE,
            T1B1: { min: '0', max: '0' },
            T2T1: { min: '0', max: '0' },
            T3T1: { min: '2.8.0', max: '0' },
        },
    },
];

describe('AbstractMethod.setFirmwareRange', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    getFirmwareRange.forEach(f => {
        it(f.description, () => {
            return new Promise<void>(done => {
                jest.resetModules();

                const mock = f.config;
                jest.mock('../../data/config', () => {
                    const actualConfig = jest.requireActual('../../data/config').config;

                    return {
                        __esModule: true,
                        config: mock || actualConfig,
                    };
                });

                import('../AbstractMethod').then(({ AbstractMethod }) => {
                    class TestMethod extends AbstractMethod<any, any> {
                        init() {}
                        run(): Promise<void> {
                            return Promise.resolve();
                        }
                    }
                    // @ts-expect-error
                    const method = new TestMethod({ payload: { method: 'signTransaction' } });

                    method.setFirmwareRange(
                        f.params[0],
                        // @ts-expect-error
                        f.params[1],
                    );

                    expect(method.firmwareRange).toEqual(f.result);
                    done();
                });
            });
        });
    });
});
