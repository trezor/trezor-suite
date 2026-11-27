import type { ExchangeTrade } from 'invity-api';

import type { ApprovalStatus } from '@suite-common/trading';
import type { UseFormReturn } from '@suite-native/forms';

import type {
    BaseFormValues,
    FormWithSendAccountValues,
    ReceiveAccount,
    TradeableAsset,
} from './general';

export type ExchangeFormValues = BaseFormValues<
    'sendCryptoAmount' | 'sendBaseCurrencyAmount' | 'receiveCryptoAmount',
    ExchangeTrade
> &
    FormWithSendAccountValues & {
        receiveAsset: TradeableAsset | undefined;
        receiveAccount: ReceiveAccount | undefined;
    };

export type ExchangeFormValidatedValues = {
    sendCryptoAmount: number | undefined;
};

export type ExchangeFormType = UseFormReturn<
    ExchangeFormValues,
    object,
    ExchangeFormValidatedValues
>;

// Approval steps of the swap flow. Undefined when the swap is the only step.
export type ExchangeFlowApprovalStatus = Extract<
    ApprovalStatus,
    'needs_approval' | 'needs_increase' | 'needs_revoke'
>;
