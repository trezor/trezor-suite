import coinsJSON from '@trezor/connect-common/files/coins.json';
import coinsJSONEth from '@trezor/connect-common/files/coins-eth.json';

import { parseCoinsJson, getAllNetworks } from '../../data/coinInfo';

import {
    getUnavailableCapabilities,
    parseCapabilities,
    parseRevision,
} from '../deviceFeaturesUtils';
import { Features, DeviceModelInternal } from '../../types';

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
        expect(parseCapabilities(featT1B1 as Features)).toEqual([
            'Capability_Bitcoin',
            'Capability_Bitcoin_like',
            'Capability_Crypto',
            'Capability_Ethereum',
            'Capability_NEM',
            'Capability_Stellar',
            'Capability_U2F',
        ]);

        // default T2T1
        expect(parseCapabilities(featT2T1 as Features)).toEqual([
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
            patch_version: 1,
            capabilities: undefined,
            internal_model: DeviceModelInternal.T2B1,
        } as unknown as Features;
        featT2B1.capabilities = parseCapabilities(featT2B1);

        it('default T1B1', () => {
            const coins = getAllNetworks();

            expect(getUnavailableCapabilities(featT1B1, coins)).toEqual({
                ada: 'no-support',
                tada: 'no-support',
                bnb: 'no-support',
                eos: 'no-support',
                ppc: 'update-required',
                sol: 'no-support',
                dsol: 'no-support',
                sys: 'update-required',
                tppc: 'update-required',
                txrp: 'no-support',
                uno: 'update-required',
                xrp: 'no-support',
                xtz: 'no-support',
                xvg: 'update-required',
                zcr: 'update-required',
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
        });

        it('default T2T1', () => {
            const coins = getAllNetworks();

            expect(getUnavailableCapabilities(featT2T1, coins)).toEqual({
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
                sol: 'no-capability',
                dsol: 'no-capability',
            });
        });

        it('default T2B1', () => {
            const coins = getAllNetworks();

            expect(getUnavailableCapabilities(featT2B1, coins)).toEqual({
                btg: 'no-support',
                tbtg: 'no-support',
                dash: 'no-support',
                tdash: 'no-support',
                dcr: 'no-support',
                tdcr: 'no-support',
                dgb: 'no-support',
                eos: 'no-support',
                nmc: 'no-support',
                sol: 'no-capability',
                dsol: 'no-capability',
                vtc: 'no-support',
                xem: 'no-support',
            });
        });

        it('T2T1 update-required', done => {
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

            import('../deviceFeaturesUtils').then(({ getUnavailableCapabilities }) => {
                // added new capability
                expect(getUnavailableCapabilities(featT2T1, coins)).toEqual({
                    newCapabilityOrFeature: 'update-required',
                });
                done();
            });
        });

        it('T2T1 no-support', done => {
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

            import('../deviceFeaturesUtils').then(({ getUnavailableCapabilities }) => {
                // added new capability
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
