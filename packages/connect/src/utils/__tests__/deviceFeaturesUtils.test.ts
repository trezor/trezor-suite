import coinsJSON from '@trezor/connect-common/files/coins.json';
import coinsJSONEth from '@trezor/connect-common/files/coins-eth.json';

import { parseCoinsJson, getAllNetworks } from '../../data/coinInfo';

import {
    getUnavailableCapabilities,
    parseCapabilities,
    parseRevision,
} from '../deviceFeaturesUtils';

describe('utils/deviceFeaturesUtils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    beforeAll(() => {
        parseCoinsJson({
            ...coinsJSON,
            eth: coinsJSONEth,
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
        // @ts-expect-error - incomplete features
        expect(parseCapabilities(featT1B1)).toEqual([
            'Capability_Bitcoin',
            'Capability_Bitcoin_like',
            'Capability_Crypto',
            'Capability_Ethereum',
            'Capability_NEM',
            'Capability_Stellar',
            'Capability_U2F',
        ]);

        // default T2
        // @ts-expect-error - incomplete features
        expect(parseCapabilities(featT2T1)).toEqual([
            'Capability_Bitcoin',
            'Capability_Bitcoin_like',
            'Capability_Binance',
            'Capability_Cardano',
            'Capability_Crypto',
            'Capability_EOS',
            'Capability_Ethereum',
            'Capability_Monero',
            'Capability_NEM',
            'Capability_Ripple',
            'Capability_Stellar',
            'Capability_Tezos',
            'Capability_U2F',
            'Capability_Solana',
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
            'Capability_Binance',
            'Capability_Cardano',
            'Capability_Crypto',
            'Capability_EOS',
            'Capability_Ethereum',
            'Capability_Monero',
            'Capability_NEM',
            'Capability_Ripple',
            'Capability_Stellar',
            'Capability_Tezos',
            'Capability_U2F',
            'Capability_Solana',
        ]);

        // bitcoin only
        expect(
            // @ts-expect-error incomplete features
            parseCapabilities({
                major_version: 1,
                capabilities: ['Capability_Bitcoin'],
            }),
        ).toEqual(['Capability_Bitcoin']);

        // no features
        // @ts-expect-error
        expect(parseCapabilities(null)).toEqual([]);
    });

    describe('getUnavailableCapabilities', () => {
        const coins = getAllNetworks();

        const featT2T1 = {
            major_version: 2,
            minor_version: 3,
            patch_version: 3,
            capabilities: undefined,
        };
        // @ts-expect-error incomplete features
        featT2T1.capabilities = parseCapabilities(featT2T1);

        const featT1B1 = {
            major_version: 1,
            minor_version: 8,
            patch_version: 3,
            capabilities: undefined,
        };
        // @ts-expect-error incomplete features
        featT1B1.capabilities = parseCapabilities(featT1B1);

        it('getUnavailableCapabilities capabilities 3', () => {
            jest.resetModules();
            const coins = getAllNetworks();
            // default Capabilities T1B1
            // @ts-expect-error incomplete features

            expect(getUnavailableCapabilities(featT1B1, coins)).toEqual({
                ada: 'no-support',
                tada: 'no-support',
                bnb: 'no-support',
                eos: 'no-support',
                ppc: 'update-required',
                sys: 'update-required',
                tppc: 'update-required',
                txrp: 'no-support',
                uno: 'update-required',
                xrp: 'no-support',
                xtz: 'no-support',
                xvg: 'update-required',
                zcr: 'update-required',
                sol: 'no-support',
                replaceTransaction: 'update-required',
                amountUnit: 'update-required',
                decreaseOutput: 'update-required',
                eip1559: 'update-required',
                'eip712-domain-only': 'update-required',
                taproot: 'update-required',
                tsep: 'update-required',
                tgor: 'update-required',
                coinjoin: 'update-required',
                signMessageNoScriptType: 'update-required',
            });

            // default Capabilities T2T1
            // @ts-expect-error incomplete features
            expect(getUnavailableCapabilities(featT2T1, coins)).toEqual({
                replaceTransaction: 'update-required',
                amountUnit: 'update-required',
                decreaseOutput: 'update-required',
                eip1559: 'update-required',
                'eip712-domain-only': 'update-required',
                taproot: 'update-required',
                tsep: 'update-required',
                tgor: 'update-required',
                sol: 'update-required',
                coinjoin: 'update-required',
                signMessageNoScriptType: 'update-required',
            });
        });
        it('getUnavailable 1', done => {
            jest.resetModules();

            jest.mock('../../data/config', () => ({
                __esModule: true,
                config: {
                    supportedFirmware: [
                        {
                            min: ['0', '2.99.99'],
                            capabilities: ['newCapabilityOrFeature'],
                        },
                    ],
                },
            }));

            import('../deviceFeaturesUtils').then(({ getUnavailableCapabilities }) => {
                // added new capability
                // @ts-expect-error incomplete features
                expect(getUnavailableCapabilities(featT2T1, coins)).toEqual({
                    newCapabilityOrFeature: 'update-required',
                });
                done();
            });
        });

        it('getUnavailable 2', done => {
            jest.resetModules();
            jest.mock('../../data/config', () => ({
                __esModule: true,
                config: {
                    supportedFirmware: [
                        {
                            min: ['0', '0'],
                            capabilities: ['newCapabilityOrFeature'],
                        },
                    ],
                },
            }));

            import('../deviceFeaturesUtils').then(({ getUnavailableCapabilities }) => {
                // added new capability
                // @ts-expect-error incomplete features
                expect(getUnavailableCapabilities(featT2T1, coins)).toEqual({
                    newCapabilityOrFeature: 'no-support',
                });
                done();
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
