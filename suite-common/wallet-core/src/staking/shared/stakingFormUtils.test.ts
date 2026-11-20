import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type ExternalOutput } from '@suite-common/wallet-types';
import { type FeeLevel } from '@trezor/connect';

import { calculateStakeFormTransaction } from './stakingFormUtils';

const output: ExternalOutput = {
    type: 'payment',
    address: '11111111111111111111111111111112',
    amount: '1100000000',
};
const feeLevel: FeeLevel = { label: 'normal', feePerUnit: '300000', blocks: 1 };
const stakingParams = {
    feeInBaseUnits: '2291480',
    minBalanceForStakingInBaseUnits: '1020000000',
    minAmountForStakingInBaseUnits: '1000000000',
    minAmountForWithdrawalInBaseUnits: '20000000',
};

describe('calculateStakeFormTransaction Solana fee errors', () => {
    it.each(['100000000', '0'])(
        'does not claim insufficient funds after a failed estimate, balance %s',
        balance => {
            expect(
                calculateStakeFormTransaction(
                    balance,
                    output,
                    feeLevel,
                    false,
                    asNetworkSymbol('sol'),
                    stakingParams,
                    { success: false },
                ),
            ).toEqual({
                type: 'error',
                error: 'TR_GENERIC_ERROR_TITLE',
                errorMessage: { id: 'TR_GENERIC_ERROR_TITLE' },
            });
        },
    );

    it('still rejects a proven fee-plus-rent shortfall after a successful estimate', () => {
        expect(
            calculateStakeFormTransaction(
                '2291479',
                output,
                feeLevel,
                false,
                asNetworkSymbol('sol'),
                stakingParams,
                { success: true, payload: { ...feeLevel, feePerTx: '2291480' } },
            ),
        ).toEqual(expect.objectContaining({ error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' }));
    });

    it('allows an unstake when the balance exactly covers its fee and rent', () => {
        expect(
            calculateStakeFormTransaction(
                '2291480',
                output,
                feeLevel,
                false,
                asNetworkSymbol('sol'),
                stakingParams,
                { success: true, payload: { ...feeLevel, feePerTx: '2291480' } },
            ),
        ).toEqual(expect.objectContaining({ type: 'final', fee: '2291480' }));
    });
});
