import { Translation } from '@suite-native/intl';

import { BuyFiatCurrencyPicker } from './BuyFiatCurrencyPicker';
import { BuyFormFieldErrorBadge } from './BuyFormFieldErrorBadge';
import { BuyTradeableAssetPicker } from './BuyTradeableAssetPicker';
import { TradingCard } from '../general/TradingCard';
import { TradingCardSection } from '../general/TradingCardSection';

type BuyCardProps = {
    isAmountInputActive: boolean;
    shouldAnimateEntering?: boolean;
};

const BUY_CARD_TEST_ID = '@trading/buyCard';

export const BuyCard = ({ isAmountInputActive, shouldAnimateEntering }: BuyCardProps) => (
    <TradingCard
        isAmountInputActive={isAmountInputActive}
        shouldAnimateEntering={shouldAnimateEntering}
    >
        <TradingCardSection
            bottomBorder
            testID={`${BUY_CARD_TEST_ID}/fiatSection`}
            title={<Translation id="moduleTrading.selectFiat.buy.title" />}
            titleAction={<BuyFormFieldErrorBadge fieldName="fiatValue" />}
        >
            <BuyFiatCurrencyPicker />
        </TradingCardSection>
        <TradingCardSection
            testID={`${BUY_CARD_TEST_ID}/cryptoSection`}
            title={<Translation id="moduleTrading.selectCoin.title" />}
            titleAction={<BuyFormFieldErrorBadge fieldName="cryptoValue" />}
        >
            <BuyTradeableAssetPicker />
        </TradingCardSection>
    </TradingCard>
);
