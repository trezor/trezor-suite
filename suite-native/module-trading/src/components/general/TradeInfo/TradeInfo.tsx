import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import type { ExchangeTrade, SellFiatTrade } from 'invity-api';

import { type TradingExchangeType, type TradingSellType } from '@suite-common/trading';
import { type FormDraftRootState, selectDeepCopyOfFormDraft } from '@suite-common/wallet-core';
import { type AccountKey, type FeeLevelLabel } from '@suite-common/wallet-types';
import { Card, Divider } from '@suite-native/atoms';
import { getFormDraftKeyByTradeType } from '@suite-native/trading-state';
import { FeeSelectorRow } from '@suite-native/transaction-management';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { ProviderInfoRow } from './ProviderInfoRow';
import { updateTradingSelectedFeeLevelThunk } from '../../../thunks';

const dividerStyle = prepareNativeStyle(utils => ({
    borderBottomColor: utils.colors.borderNeutral,
}));

type TradeInfoProps = {
    trade: ExchangeTrade | SellFiatTrade | undefined;
    accountKey: AccountKey;
    tradingType: TradingSellType | TradingExchangeType;
    children?: ReactNode;
};

export const TradeInfo = ({ trade, accountKey, tradingType, children }: TradeInfoProps) => {
    const { applyStyle } = useNativeStyles();
    const formDraftKey = getFormDraftKeyByTradeType(tradingType);
    const formDraft = useSelector((state: FormDraftRootState) =>
        selectDeepCopyOfFormDraft(state, formDraftKey),
    );

    return (
        <Card noPadding>
            <ProviderInfoRow exchange={trade?.exchange} tradingType={tradingType} noBorder />
            <Divider style={applyStyle(dividerStyle)} />
            <FeeSelectorRow
                accountKey={accountKey}
                updateThunk={updateTradingSelectedFeeLevelThunk}
                selectedFee={(formDraft?.selectedFee as FeeLevelLabel | undefined) ?? 'normal'}
                selectedFeePerUnit={formDraft?.feePerUnit}
                formDraft={formDraft}
                formDraftKey={formDraftKey}
            />
            {children}
        </Card>
    );
};
