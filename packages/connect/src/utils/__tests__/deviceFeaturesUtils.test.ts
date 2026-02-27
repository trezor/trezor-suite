import coinsJSONEth from '@trezor/connect-data/files/coins-eth.json';
import coinsJSON from '@trezor/connect-data/files/coins.json';
import { DeviceModelInternal } from '@trezor/device-utils';

import { getAllNetworks, parseCoinsJson } from '../../data/coinInfo';
import { CoinInfo, Features } from '../../types';
import {
    getUnavailableCapabilities,
    parseCapabilities,
    parseRevision,
} from '../deviceFeaturesUtils';

const T1B1_UPDATE_REQUIRED = {
    amountUnit: 'update-required',
    coinjoin: 'update-required',
    decreaseOutput: 'update-required',
    eip1559: 'update-required',
    'eip712-domain-only': 'update-required',
    entropyCheck: 'update-required',
    getFirmwareHash: 'update-required',
    replaceTransaction: 'update-required',
    signMessageNoScriptType: 'update-required',
    taproot: 'update-required',
};

describe('utils/deviceFeaturesUtils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    beforeAll(() => {
        parseCoinsJson({
            ...coinsJSON,
            ...coinsJSONEth,
        });
    });

    it('parseCapabilities', () => {
        const featT1B1 = {
            major_version: 1,
        };
        const featT2T1 = {
            major_version: 2,
        };
        // default T1B1
        expect(parseCapabilities(featT1B1 as Features)).toEqual([
            'Capability_Bitcoin',
            'Capability_Bitcoin_like',
            'Capability_Crypto',
            'Capability_Ethereum',
            'Capability_Stellar',
            'Capability_U2F',
        ]);

        // default T2T1
        expect(parseCapabilities(featT2T1 as Features)).toEqual([
            'Capability_Bitcoin',
            'Capability_Bitcoin_like',
            'Capability_Cardano',
            'Capability_Crypto',
            'Capability_Ethereum',
            'Capability_Monero',
            'Capability_Ripple',
            'Capability_Solana',
            'Capability_Stellar',
            'Capability_Tezos',
            'Capability_U2F',
        ]);

        expect(
            // @ts-expect-error - incomplete features
            parseCapabilities({
                major_version: 2,
                capabilities: [],
            }),
        ).toEqual([
            'Capability_Bitcoin',
            'Capability_Bitcoin_like',
            'Capability_Cardano',
            'Capability_Crypto',
            'Capability_Ethereum',
            'Capability_Monero',
            'Capability_Ripple',
            'Capability_Solana',
            'Capability_Stellar',
            'Capability_Tezos',
            'Capability_U2F',
        ]);

        // bitcoin only
        expect(
            parseCapabilities({
                major_version: 1,
                capabilities: ['Capability_Bitcoin'],
            } as Features),
        ).toEqual(['Capability_Bitcoin']);

        // no features
        // @ts-expect-error
        expect(parseCapabilities(null)).toEqual([]);
    });

    describe('getUnavailableCapabilities', () => {
        const coins = getAllNetworks();
        beforeEach(() => {
            jest.resetModules();
        });

        const featT2T1 = {
            major_version: 2,
            minor_version: 3,
            patch_version: 3,
            capabilities: undefined,
            internal_model: DeviceModelInternal.T2T1,
        } as unknown as Features;
        featT2T1.capabilities = parseCapabilities(featT2T1);

        const featT1B1 = {
            major_version: 1,
            minor_version: 8,
            patch_version: 3,
            capabilities: undefined,
            internal_model: DeviceModelInternal.T1B1,
        } as unknown as Features;
        featT1B1.capabilities = parseCapabilities(featT1B1);

        const featT2B1 = {
            major_version: 2,
            minor_version: 6,
            patch_version: 2,
            capabilities: undefined,
            internal_model: DeviceModelInternal.T2B1,
        } as unknown as Features;
        featT2B1.capabilities = parseCapabilities(featT2B1);

        it('default T1B1', () => {
            const coins2 = getAllNetworks();

            expect(getUnavailableCapabilities(featT1B1, coins2)).toEqual({
                ada: 'no-support',
                tada: 'no-support',
                arb: 'update-required',
                base: 'update-required',
                bsc: 'update-required',
                crw: 'update-required',
                maid: 'no-capability',
                monero: 'no-support',
                pol: 'update-required',
                omni: 'no-capability',
                op: 'update-required',
                avax: 'update-required',
                ppc: 'update-required',
                sol: 'no-support',
                dsol: 'no-support',
                sys: 'update-required',
                thod: 'update-required',
                tppc: 'update-required',
                trvn: 'update-required',
                trx: 'no-support',
                tsep: 'update-required',
                txrp: 'no-support',
                uno: 'update-required',
                usdt: 'no-capability',
                xmr: 'no-support',
                xrp: 'no-support',
                xtz: 'no-support',
                xvg: 'update-required',
                zcr: 'update-required',
                chunkify: 'no-support',
                evmApproval: 'no-support',
                evolu: 'no-support',
                slip24: 'no-support',
                telemetry: 'no-support',
                tutorial: 'no-support',
                ...T1B1_UPDATE_REQUIRED,
            });
        });

        it('default T2T1', () => {
            const coins2 = getAllNetworks();

            expect(getUnavailableCapabilities(featT2T1, coins2)).toEqual({
                arb: 'update-required',
                base: 'update-required',
                bsc: 'update-required',
                maid: 'no-capability',
                monero: 'update-required',
                pol: 'update-required',
                omni: 'no-capability',
                op: 'update-required',
                avax: 'update-required',
                tsep: 'update-required',
                thod: 'update-required',
                trvn: 'update-required',
                trx: 'no-capability',
                usdt: 'no-capability',
                sol: 'update-required',
                dsol: 'update-required',
                chunkify: 'update-required',
                evmApproval: 'update-required',
                evolu: 'no-support',
                slip24: 'update-required',
                telemetry: 'no-support',
                tutorial: 'no-support',
                ...T1B1_UPDATE_REQUIRED,
            });
        });

        it('default T2B1', () => {
            const coins2 = getAllNetworks();

            expect(getUnavailableCapabilities(featT2B1, coins2)).toEqual({
                btg: 'no-support',
                tbtg: 'no-support',
                dash: 'no-support',
                tdash: 'no-support',
                dgb: 'no-support',
                maid: 'no-capability',
                nmc: 'no-support',
                omni: 'no-capability',
                sol: 'update-required',
                dsol: 'update-required',
                thod: 'update-required',
                tropicDeviceAuthentication: 'no-support',
                trx: 'no-capability',
                tsep: 'update-required',
                usdt: 'no-capability',
                vtc: 'no-support',
                chunkify: 'update-required',
                entropyCheck: 'update-required',
                evmApproval: 'update-required',
                evolu: 'update-required',
                slip24: 'update-required',
                telemetry: 'no-support',
            });
        });

        it('T2T1 update-required', () =>
            new Promise<void>(done => {
                jest.resetModules();

                jest.mock('../../data/config', () => ({
                    __esModule: true,
                    config: {
                        supportedFirmware: [
                            {
                                min: { T1B1: '0', T2T1: '2.99.99' },
                                capabilities: ['newCapabilityOrFeature'],
                            },
                        ],
                    },
                }));

                // eslint-disable-next-line @typescript-eslint/no-shadow
                import('../deviceFeaturesUtils').then(({ getUnavailableCapabilities }) => {
                    // added new capability
                    expect(getUnavailableCapabilities(featT2T1, coins)).toEqual({
                        newCapabilityOrFeature: 'update-required',
                    });
                    done();
                });
            }));

        it('T2T1 no-support', () =>
            new Promise<void>(done => {
                jest.resetModules();

                jest.mock('../../data/config', () => ({
                    __esModule: true,
                    config: {
                        supportedFirmware: [
                            {
                                min: { T1B1: '0', T2T1: '0' },
                                capabilities: ['newCapabilityOrFeature'],
                            },
                        ],
                    },
                }));

                // eslint-disable-next-line @typescript-eslint/no-shadow
                import('../deviceFeaturesUtils').then(({ getUnavailableCapabilities }) => {
                    // added new capability
                    expect(getUnavailableCapabilities(featT2T1, coins)).toEqual({
                        newCapabilityOrFeature: 'no-support',
                    });
                    done();
                });
            }));

        it('handles duplicated shortcuts correctly, ', () => {
            const customCoins = [
                { shortcut: 'BSC', type: 'ethereum', support: { T2T1: '2.4.4' } },
                { shortcut: 'ETH', type: 'ethereum', support: { T2T1: false } },
            ];
            const customFeatures = {
                major_version: 2,
                minor_version: 3,
                patch_version: 3,
                capabilities: ['Capability_Bitcoin', 'Capability_Ethereum'],
                internal_model: DeviceModelInternal.T2T1,
            } as unknown as Features;

            const result = getUnavailableCapabilities(customFeatures, customCoins as CoinInfo[]);

            expect(result).toEqual({
                eth: 'no-support',
                bsc: 'update-required',
                chunkify: 'update-required',
                evmApproval: 'update-required',
                evolu: 'no-support',
                slip24: 'update-required',
                telemetry: 'no-support',
                tutorial: 'no-support',
                monero: 'update-required',
                ...T1B1_UPDATE_REQUIRED,
            });
        });

        it('handles duplicated shortcuts correctly, does not include bsc: no-support', () => {
            const customCoins = [
                { shortcut: 'BSC', type: 'ethereum', support: { T1B1: '1.1.3' } },
                { shortcut: 'ETH', type: 'ethereum', support: { T1B1: false } },
            ];
            const customFeatures = {
                major_version: 1,
                minor_version: 1,
                patch_version: 3,
                capabilities: ['Capability_Bitcoin', 'Capability_Ethereum'],
                internal_model: DeviceModelInternal.T1B1,
            } as unknown as Features;

            const result = getUnavailableCapabilities(customFeatures, customCoins as CoinInfo[]);

            expect(result).toEqual({
                eth: 'no-support',
                chunkify: 'no-support',
                evmApproval: 'no-support',
                evolu: 'no-support',
                slip24: 'no-support',
                telemetry: 'no-support',
                tutorial: 'no-support',
                monero: 'no-support',
                ...T1B1_UPDATE_REQUIRED,
            });
        });

        it('handles duplicated shortcuts correctly, includes no-support because none is supported', () => {
            const customCoins = [
                { shortcut: 'BSC', type: 'ethereum', support: { T1B1: false } },
                { shortcut: 'ETH', type: 'ethereum', support: { T1B1: false } },
            ];
            const customFeatures = {
                major_version: 1,
                minor_version: 1,
                patch_version: 3,
                capabilities: ['Capability_Bitcoin', 'Capability_Ethereum'],
                internal_model: DeviceModelInternal.T1B1,
            } as unknown as Features;

            const result = getUnavailableCapabilities(customFeatures, customCoins as CoinInfo[]);

            expect(result).toEqual({
                eth: 'no-support',
                bsc: 'no-support',
                chunkify: 'no-support',
                evmApproval: 'no-support',
                evolu: 'no-support',
                slip24: 'no-support',
                telemetry: 'no-support',
                tutorial: 'no-support',
                monero: 'no-support',
                ...T1B1_UPDATE_REQUIRED,
            });
        });
    });

    describe('parseRevision', () => {
        it('parses hexadecimal raw bytes to the standard hexadecimal notation', () => {
            // @ts-expect-error - incomplete features
            expect(parseRevision({ revision: '6466303936336563' })).toEqual('df0963ec');
        });

        it('does nothing when standard hexadecimal notation is parsed', () => {
            // @ts-expect-error - incomplete features
            expect(parseRevision({ revision: 'f4424ece1ccb7fc0d6cad00ff840fac287a34f07' })).toEqual(
                'f4424ece1ccb7fc0d6cad00ff840fac287a34f07',
            );
        });

        it('does nothing when standard hexadecimal notation with only 0-9 symbols is parsed', () => {
            // @ts-expect-error - incomplete features
            expect(parseRevision({ revision: '2442434213337100161230033840333287234307' })).toEqual(
                '2442434213337100161230033840333287234307',
            );
        });

        it('passes null, caused by bootloader mode, through', () => {
            // @ts-expect-error - incomplete features
            expect(parseRevision({ revision: null })).toEqual(null);
        });
    });
});
