import { coinSelection } from './coinSelection';
import { CertificateType } from './constants';
import { type CoinSelectionParams } from './types/types';
import { changeAddress, utxo1 } from '../mocks/mockConstants';
import { mockProtocolParams } from '../mocks/mockProtocolParams';

const accountPubKey =
    'ec8fdf616242f430855ad7477acda53395eb30c295f5a7ef038712578877375b5a2f00353c9c5cc88c7ff18e71dc08724d90fc238213b789c0b02438e336be07';

const recipient =
    'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc';

const sendParams: CoinSelectionParams = {
    utxos: [utxo1],
    outputs: [{ address: recipient, amount: '3000000', assets: [], setMax: false }],
    changeAddress,
    certificates: [],
    withdrawals: [],
    accountPubKey,
};

const stakeRegistrationParams: CoinSelectionParams = {
    ...sendParams,
    outputs: [],
    certificates: [{ type: CertificateType.STAKE_REGISTRATION }],
};

describe('coinSelection protocol params', () => {
    test('random-improve uses the provided fee params', () => {
        const result = coinSelection(sendParams, {
            protocolParams: mockProtocolParams({ minFeeA: '0', minFeeB: '200000' }),
        });

        expect(result).toMatchObject({ type: 'final', fee: '200000', totalSpent: '3200000' });
    });

    test('largest-first uses the provided fee params', () => {
        const result = coinSelection(sendParams, {
            forceLargestFirstSelection: true,
            protocolParams: mockProtocolParams({ minFeeA: '0', minFeeB: '200000' }),
        });

        expect(result).toMatchObject({ type: 'final', fee: '200000', totalSpent: '3200000' });
    });

    test('stake registration uses the provided key deposit', () => {
        const result = coinSelection(stakeRegistrationParams, {
            protocolParams: mockProtocolParams({ keyDeposit: '3000000' }),
        });

        expect(result).toMatchObject({ type: 'final', deposit: '3000000' });
    });

    test('draft plan uses the provided key deposit', () => {
        const result = coinSelection(
            {
                ...stakeRegistrationParams,
                outputs: [{ address: recipient, assets: [], setMax: false }],
            },
            { protocolParams: mockProtocolParams({ keyDeposit: '3000000' }) },
        );

        expect(result).toMatchObject({ type: 'nonfinal', deposit: '3000000' });
    });

    test('falls back to the default protocol params', () => {
        const result = coinSelection(stakeRegistrationParams);

        expect(result).toMatchObject({ type: 'final', deposit: '2000000', fee: '167173' });
    });
});
