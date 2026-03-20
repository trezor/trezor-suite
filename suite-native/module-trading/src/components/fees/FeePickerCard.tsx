import { useSelector } from 'react-redux';

import type { ExchangeTrade, SellFiatTrade } from 'invity-api';

import { type TradingExchangeType, type TradingSellType } from '@suite-common/trading';
import { type FormDraftRootState, selectDeepCopyOfFormDraft } from '@suite-common/wallet-core';
import { type AccountKey, type FeeLevelLabel } from '@suite-common/wallet-types';
import { AnimatedCard, Divider } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { TradeInfoHeader } from '@suite-native/trading-atoms';
import { getFormDraftKeyByTradeType } from '@suite-native/trading-state';
import { FeeSelector } from '@suite-native/transaction-management';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { updateTradingSelectedFeeLevelThunk } from '../../thunks';
import { ProviderReceiveAddress } from '../general/ProviderReceiveAddress';

const dividerStyle = prepareNativeStyle(utils => ({
    borderBottomColor: utils.colors.borderOnElevation1,
}));

type FeePickerCardProps = {
    trade: ExchangeTrade | SellFiatTrade | undefined;
    accountKey: AccountKey;
    tradingType: TradingSellType | TradingExchangeType;
};

export const FeePickerCard = ({ trade, accountKey, tradingType }: FeePickerCardProps) => {
    const { applyStyle } = useNativeStyles();
    const formDraftKey = getFormDraftKeyByTradeType(tradingType);
    const formDraft = useSelector((state: FormDraftRootState) =>
        selectDeepCopyOfFormDraft(state, formDraftKey),
    );

    return (
        <AnimatedCard noPadding>
            <TradeInfoHeader
                title={<Translation id="moduleTrading.tradingExchangePreviewScreen.details" />}
            />
            {trade && <ProviderReceiveAddress trade={trade} />}
            <Divider style={applyStyle(dividerStyle)} />
            <FeeSelector
                accountKey={accountKey}
                updateThunk={updateTradingSelectedFeeLevelThunk}
                selectedFee={(formDraft?.selectedFee as FeeLevelLabel | undefined) ?? 'normal'}
                selectedFeePerUnit={formDraft?.feePerUnit}
                formDraft={formDraft}
                formDraftKey={formDraftKey}
            />
        </AnimatedCard>
    );
};
