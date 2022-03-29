import coinsJSON from '@trezor/connect-common/files/coins.json';
import { config } from '../../data/config';
import { parseCoinsJson, getAllNetworks } from '../../data/CoinInfo';

import {
    parseCapabilities,
    getUnavailableCapabilities,
    parseRevision,
} from '../deviceFeaturesUtils';

describe('utils/deviceFeaturesUtils', () => {
    beforeAll(() => {
        parseCoinsJson(coinsJSON);
    });

    it('parseCapabilities', () => {
        const feat1 = {
            major_version: 1,
        };
        const feat2 = {
            major_version: 2,
        };
        // default T1
        // @ts-expect-error - incomplete features
        expect(parseCapabilities(feat1)).toEqual([
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
        expect(parseCapabilities(feat2)).toEqual([
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
                // @ts-expect-error - wrong/legacy decoding of capabilities in @trezor/transport
                capabilities: [1],
            }),
        ).toEqual(['Capability_Bitcoin']);

        // no features
        // @ts-expect-error
        expect(parseCapabilities(null)).toEqual([]);

        // unknown
        expect(
            parseCapabilities({
                major_version: 1,
                // @ts-expect-error - wrong/legacy decoding of capabilities in @trezor/transport
                capabilities: [1000],
            }),
        ).toEqual([]);
    });

    it('getUnavailableCapabilities', () => {
        const support = config.supportedFirmware;
        const coins = getAllNetworks();

        const feat1 = {
            major_version: 1,
            minor_version: 8,
            patch_version: 3,
            capabilities: undefined,
        };
        // @ts-expect-error - incomplete features
        feat1.capabilities = parseCapabilities(feat1);

        // default Capabilities T1
        // @ts-expect-error - incomplete features
        expect(getUnavailableCapabilities(feat1, coins, support)).toEqual({
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
            replaceTransaction: 'update-required',
            decreaseOutput: 'update-required',
            eip1559: 'update-required',
            'eip712-domain-only': 'update-required',
            taproot: 'update-required',
            signMessageNoScriptType: 'update-required',
        });

        const feat2 = {
            major_version: 2,
            minor_version: 3,
            patch_version: 3,
            capabilities: undefined,
        };
        // @ts-expect-error - incomplete features
        feat2.capabilities = parseCapabilities(feat2);

        // default Capabilities T2
        // @ts-expect-error - incomplete features
        expect(getUnavailableCapabilities(feat2, coins, support)).toEqual({
            replaceTransaction: 'update-required',
            decreaseOutput: 'update-required',
            eip1559: 'update-required',
            'eip712-domain-only': 'update-required',
            taproot: 'update-required',
            signMessageNoScriptType: 'update-required',
        });

        // added new capability
        expect(
            // @ts-expect-error - incomplete features
            getUnavailableCapabilities(feat2, coins, [
                {
                    min: ['0', '2.99.99'],
                    capabilities: ['newCapabilityOrFeature'],
                },
            ]),
        ).toEqual({
            newCapabilityOrFeature: 'update-required',
        });

        expect(
            // @ts-expect-error - incomplete features
            getUnavailableCapabilities(feat2, coins, [
                {
                    min: ['0', '0'],
                    capabilities: ['newCapabilityOrFeature'],
                },
            ]),
        ).toEqual({
            newCapabilityOrFeature: 'no-support',
        });

        // without capabilities
        // @ts-expect-error - incomplete features
        expect(getUnavailableCapabilities({}, coins, support)).toEqual({});
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
