import { useSelector } from 'react-redux';

import type { TradingExchangeType, TradingSellType } from '@suite-common/trading';
import { type FormDraftRootState, selectDeepCopyOfFormDraft } from '@suite-common/wallet-core';
import type { AccountKey, FeeLevelLabel } from '@suite-common/wallet-types';
import { getFormDraftKeyByTradeType } from '@suite-native/trading-state';
import { FeeSelectorRow } from '@suite-native/transaction-management';

import { useComposeTradingTransaction } from '../../../hooks/general/useComposeTradingTransaction';
import { updateTradingSelectedFeeLevelThunk } from '../../../thunks';

export type TradeFeeInfoRowProps = {
    accountKey: AccountKey;
    tradingType: TradingSellType | TradingExchangeType;
};

export const TradeFeeInfoRow = ({ accountKey, tradingType }: TradeFeeInfoRowProps) => {
    const { composeTradingTransaction } = useComposeTradingTransaction({ tradeType: tradingType });
    const formDraftKey = getFormDraftKeyByTradeType(tradingType);
    const formDraft = useSelector((state: FormDraftRootState) =>
        selectDeepCopyOfFormDraft(state, formDraftKey),
    );

    return (
        <FeeSelectorRow
            accountKey={accountKey}
            updateThunk={updateTradingSelectedFeeLevelThunk}
            selectedFee={(formDraft?.selectedFee as FeeLevelLabel | undefined) ?? 'normal'}
            selectedFeePerUnit={formDraft?.feePerUnit}
            formDraft={formDraft}
            formDraftKey={formDraftKey}
            onFeeConfirmed={composeTradingTransaction}
        />
    );
};
