import { useSelector } from 'react-redux';

import type { ExchangeTrade, SellFiatTrade } from 'invity-api';

import {
    type TradingExchangeType,
    type TradingSellType,
    hasFixedPsbtFee,
    isExchangeTrade,
} from '@suite-common/trading';
import {
    type AccountsRootState,
    type FormDraftRootState,
    selectAccountNetworkType,
    selectDeepCopyOfFormDraft,
} from '@suite-common/wallet-core';
import type { AccountKey, FeeLevelLabel } from '@suite-common/wallet-types';
import { getFormDraftKeyByTradeType } from '@suite-native/trading-state';
import { FeeSelectorRow } from '@suite-native/transaction-management';

import { useComposeTradingTransaction } from '../../../hooks/general/useComposeTradingTransaction';
import { updateTradingSelectedFeeLevelThunk } from '../../../thunks';

export type TradeFeeInfoRowProps = {
    trade: ExchangeTrade | SellFiatTrade | undefined;
    accountKey: AccountKey;
    tradingType: TradingSellType | TradingExchangeType;
};

export const TradeFeeInfoRow = ({ trade, accountKey, tradingType }: TradeFeeInfoRowProps) => {
    const { composeTradingTransaction } = useComposeTradingTransaction({ tradeType: tradingType });
    const formDraftKey = getFormDraftKeyByTradeType(tradingType);
    const formDraft = useSelector((state: FormDraftRootState) =>
        selectDeepCopyOfFormDraft(state, formDraftKey),
    );
    const networkType = useSelector((state: AccountsRootState) =>
        selectAccountNetworkType(state, accountKey),
    );
    const isFeeFixed =
        !!trade && !!networkType && isExchangeTrade(trade) && hasFixedPsbtFee(trade, networkType);

    return (
        <FeeSelectorRow
            accountKey={accountKey}
            updateThunk={updateTradingSelectedFeeLevelThunk}
            selectedFee={(formDraft?.selectedFee as FeeLevelLabel | undefined) ?? 'normal'}
            selectedFeePerUnit={formDraft?.feePerUnit}
            formDraft={formDraft}
            formDraftKey={formDraftKey}
            onFeeConfirmed={composeTradingTransaction}
            isReadOnly={isFeeFixed}
        />
    );
};
