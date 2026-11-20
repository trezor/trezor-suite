import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type ExternalOutput } from '@suite-common/wallet-types';
import { mockAccountToken } from '@suite-common/wallet-types/mocks';
import { type TronAccountExtraData } from '@trezor/blockchain-link-types';

import { calculateTrc20Transfer } from './calculateTrc20Transfer';
import { type EstimateFeeLevel } from './types';
import { mockTronResources } from '../../../mocks';

const trxSymbol = asNetworkSymbol('trx');
const BYTES = 345;

const feeLevel: EstimateFeeLevel = { feePerUnit: '100', feePerTx: '6500000' };

const output: ExternalOutput = {
    type: 'payment',
    address: 'TVDGpn4hCSzJ5nkHPLetk8KQBtwaTppnkr',
    amount: '1000000',
};

const token = mockAccountToken({
    contract: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    symbol: 'usdt',
    standard: 'TRC20',
    decimals: 6,
    balance: '50',
});

const notEnoughFee = { type: 'error', error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' };

describe(calculateTrc20Transfer.name, () => {
    it.each<[string, TronAccountExtraData | undefined, string, object]>([
        [
            'energy covers everything',
            mockTronResources({ availableEnergy: 65000 }),
            '0',
            { type: 'final', fee: '6500000', feeLimit: '6500000', burnedFee: '0' },
        ],
        [
            'energy covers, bandwidth burn exceeds the balance',
            mockTronResources({ availableEnergy: 65000, availableFreeBandwidth: 0 }),
            '344999',
            notEnoughFee,
        ],
        [
            'half energy, balance equals the remaining burn',
            mockTronResources({ availableEnergy: 32500 }),
            '3250000',
            { type: 'final', burnedFee: '3250000' },
        ],
        [
            'half energy, balance one SUN short',
            mockTronResources({ availableEnergy: 32500 }),
            '3249999',
            notEnoughFee,
        ],
        ['no energy, balance below the cap', mockTronResources(), '6499999', notEnoughFee],
        ['no account resources', undefined, '6845000', { type: 'final', burnedFee: '6845000' }],
    ])('%s', (_title, tronResources, availableBalance, expected) => {
        expect(
            calculateTrc20Transfer(
                availableBalance,
                output,
                feeLevel,
                token,
                trxSymbol,
                BYTES,
                false,
                tronResources,
            ),
        ).toMatchObject(expected);
    });

    it('keeps burning the memo fee when energy covers the transfer', () => {
        expect(
            calculateTrc20Transfer(
                '999999',
                output,
                feeLevel,
                token,
                trxSymbol,
                BYTES,
                true,
                mockTronResources({ availableEnergy: 65000 }),
            ),
        ).toMatchObject(notEnoughFee);
    });
});
