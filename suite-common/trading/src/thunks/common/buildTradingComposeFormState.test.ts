import { type TrezorDevice } from '@suite-common/suite-types';
import { type Account, type FormStateTrading } from '@suite-common/wallet-types';
import { type TokenInfo } from '@trezor/connect';

import { buildTradingComposeFormState } from './buildTradingComposeFormState';
import { type TradingComposedTransactionInfo } from '../../reducers/tradingCommonReducer';

const APPROVE_CALLDATA =
    '0x095ea7b3000000000000000000000000c6594cd50c39ba5f23538fdc3b8492c95edb6fe1000000000000000000000000000000000000000000000000000000000133e122';

const device = { unavailableCapabilities: {} } as TrezorDevice;

const composed = {
    feePerByte: '100',
    feeLimit: '1000',
    estimatedFeeLimit: '1000',
    fee: '1000',
    token: { contract: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' } as TokenInfo,
    outputs: [],
} as unknown as NonNullable<TradingComposedTransactionInfo['composed']>;

const tradingFormState = {
    activeSection: 'exchange',
    isSlip24Active: false,
} as unknown as FormStateTrading;

const build = (symbol: string, transactionData?: string) =>
    buildTradingComposeFormState({
        account: { symbol } as Account,
        device,
        address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
        amount: '0',
        transactionData,
        composed,
        selectedFee: 'normal',
        tradingFormState,
    });

describe('buildTradingComposeFormState token inclusion', () => {
    it('excludes the token for a Tron approve so the calldata is preserved', () => {
        const formState = build('trx', APPROVE_CALLDATA);

        expect(formState.outputs[0]?.token).toBeNull();
        expect(formState.transactionData).toBe(APPROVE_CALLDATA);
    });

    it('includes the token for an EVM approve (approval flow)', () => {
        const formState = build('eth', APPROVE_CALLDATA);

        expect(formState.outputs[0]?.token).toBe(composed.token?.contract);
    });

    it('includes the token when there is no transaction data', () => {
        const formState = build('trx');

        expect(formState.outputs[0]?.token).toBe(composed.token?.contract);
    });
});
