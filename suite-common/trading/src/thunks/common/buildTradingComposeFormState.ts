import { isApprovalFlowSupported } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { getNetwork } from '@suite-common/wallet-config';
import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@suite-common/wallet-constants';
import {
    type Account,
    type FormOptions,
    type FormState,
    type FormStateTrading,
} from '@suite-common/wallet-types';
import { isEvmApprovalTx } from '@suite-common/wallet-utils';

import { type TradingComposedTransactionInfo } from '../../reducers/tradingCommonReducer';

export type BuildTradingComposeFormStateParams = {
    account: Account;
    device: TrezorDevice | undefined;
    address: string;
    amount: string;
    destinationTag?: string;
    transactionData?: string;
    ethereumAdjustGasLimit?: string;
    setMaxOutputId?: number | undefined;
    composed: NonNullable<TradingComposedTransactionInfo['composed']>;
    selectedFee: TradingComposedTransactionInfo['selectedFee'];
    tradingFormState: FormStateTrading;
};

const getShouldIncludeToken = ({
    account,
    device,
    transactionData,
}: Pick<BuildTradingComposeFormStateParams, 'account' | 'device' | 'transactionData'>) =>
    !transactionData ||
    (isApprovalFlowSupported(device) && isEvmApprovalTx(transactionData)) ||
    getNetwork(account.symbol).networkType === 'solana';

export const buildTradingComposeFormState = ({
    account,
    device,
    address,
    amount,
    destinationTag,
    transactionData,
    ethereumAdjustGasLimit,
    setMaxOutputId,
    composed,
    selectedFee,
    tradingFormState,
}: BuildTradingComposeFormStateParams): FormState => {
    const options: FormOptions[] = ['broadcast'];
    const shouldIncludeToken = getShouldIncludeToken({ account, device, transactionData });

    return {
        ...DEFAULT_VALUES,
        outputs: [
            {
                ...DEFAULT_PAYMENT,
                address,
                amount,
                currency: DEFAULT_PAYMENT.currency,
                token: shouldIncludeToken ? (composed.token?.contract ?? null) : null,
            },
        ],
        setMaxOutputId: !composed.token?.contract ? setMaxOutputId : undefined,
        selectedFee,
        feePerUnit: composed.feePerByte,
        feeLimit: composed.feeLimit ?? '',
        estimatedFeeLimit: composed.estimatedFeeLimit,
        maxFeePerGas: composed.maxFeePerGas,
        maxPriorityFeePerGas: composed.maxPriorityFeePerGas,
        options,
        destinationTag,
        transactionData,
        ethereumAdjustGasLimit,
        selectedUtxos: [],
        trading: tradingFormState,
    };
};
