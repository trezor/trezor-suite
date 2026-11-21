import { type TradingComposedTransactionInfo } from '@suite-common/trading';
import { type Account, type FeeInfo, type FormState } from '@suite-common/wallet-types';

import { getSupportsAdjustableFees } from '#src/components/wallet/Fees/feeUtils';

import { type TradingNetworkFeeInfoItemProps } from './TradingNetworkFeeInfoItem';

type GetTradingNetworkFeeEditParams = {
    account: Account;
    feeInfo: FeeInfo | null;
    composeFormState: FormState | undefined;
    assumeNewAccount?: boolean;
    onConfirm: (composedTransactionInfo: TradingComposedTransactionInfo) => void;
    isTokenTransfer: boolean;
    hasFixedFee?: boolean;
};

export const getTradingNetworkFeeEdit = ({
    account,
    feeInfo,
    composeFormState,
    assumeNewAccount,
    onConfirm,
    isTokenTransfer,
    hasFixedFee = false,
}: GetTradingNetworkFeeEditParams): TradingNetworkFeeInfoItemProps['edit'] => {
    const isTronRecipientUnknown = account.networkType === 'tron' && !!assumeNewAccount;
    const isEditable =
        !hasFixedFee &&
        !isTronRecipientUnknown &&
        getSupportsAdjustableFees({ networkType: account.networkType, isTokenTransfer });

    if (!isEditable || !feeInfo || !composeFormState) {
        return undefined;
    }

    return { account, feeInfo, composeFormState, assumeNewAccount, onConfirm };
};
