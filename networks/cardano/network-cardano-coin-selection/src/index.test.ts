import { changeAddress, utxo1 } from './__fixtures__/constants';
import { CertificateType } from './constants';
import { DEFAULT_CARDANO_PROTOCOL_PARAMS } from './protocolParams';

import { coinSelection } from './index';

const accountPubKey =
    'ec8fdf616242f430855ad7477acda53395eb30c295f5a7ef038712578877375b5a2f00353c9c5cc88c7ff18e71dc08724d90fc238213b789c0b02438e336be07';

describe('coinSelection protocol parameters', () => {
    const params = {
        utxos: [utxo1],
        outputs: [],
        changeAddress,
        certificates: [{ type: CertificateType.STAKE_REGISTRATION } as const],
        withdrawals: [],
        accountPubKey,
    };

    it('locks the key deposit reported by the protocol parameters, not a baked-in constant', () => {
        const withDefaults = coinSelection(params);
        expect(withDefaults.deposit).toBe(DEFAULT_CARDANO_PROTOCOL_PARAMS.keyDeposit);

        const withOverride = coinSelection(params, {
            protocolParams: { keyDeposit: '3000000' },
        });
        expect(withOverride.deposit).toBe('3000000');
    });

    it('feeds min_fee_a and min_fee_b into the fee algorithm', () => {
        const free = coinSelection(params, {
            protocolParams: { minFeeA: '0', minFeeB: '0' },
        });
        expect(free.fee).toBe('0');

        const constantFeeOnly = coinSelection(params, {
            protocolParams: { minFeeA: '0', minFeeB: '155381' },
        });
        expect(constantFeeOnly.fee).toBe('155381');
    });

    it('raises the min-UTxO floor when coinsPerUtxoByte rises', () => {
        const cheap = coinSelection(params, {
            protocolParams: { coinsPerUtxoByte: '4310' },
        });
        const expensive = coinSelection(params, {
            protocolParams: { coinsPerUtxoByte: '43100' },
        });

        expect(Number(expensive.totalSpent)).toBeGreaterThan(Number(cheap.totalSpent));
    });
});
