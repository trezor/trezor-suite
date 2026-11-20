import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type ExternalOutput } from '@suite-common/wallet-types';

import { calculateRawContractCall } from './calculateRawContractCall';
import { type EstimateFeeLevel } from './types';
import { mockTronResources } from '../../../mocks';

const trxSymbol = asNetworkSymbol('trx');
const BYTES = 345;

const feeLevel: EstimateFeeLevel = { feePerUnit: '100', feePerTx: '6500000' };

const output: ExternalOutput = {
    type: 'payment',
    address: 'TVDGpn4hCSzJ5nkHPLetk8KQBtwaTppnkr',
    amount: '5000000',
};

describe(calculateRawContractCall.name, () => {
    it.each([
        ['balance equals the call value', '5000000', { type: 'final', burnedFee: '0' }],
        [
            'balance below the call value',
            '4999999',
            { type: 'error', error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' },
        ],
    ])('lets staked energy cover the fee, %s', (_title, availableBalance, expected) => {
        expect(
            calculateRawContractCall(
                availableBalance,
                output,
                feeLevel,
                trxSymbol,
                BYTES,
                false,
                mockTronResources({ availableEnergy: 65000 }),
            ),
        ).toMatchObject(expected);
    });
});
