import { Box, HStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { BuyFiatCurrencyPicker } from './BuyFiatCurrencyPicker';
import { BuyFormFieldErrorBadge } from './BuyFormFieldErrorBadge';
import { BuyReceiveAccountCryptoBalance } from './BuyReceiveAccountCryptoBalance';
import { BuyReceiveAccountPicker } from './BuyReceiveAccountPicker';
import { BuyTradeableAssetPicker } from './BuyTradeableAssetPicker';
import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { CryptoToFiatValueBadge } from '../general/CryptoToFiatValueBadge';
import { TradeableAssetNetworkInfo } from '../general/TradeableAssetNetworkInfo';
import { TradingCard } from '../general/TradingCard';
import { TradingCardSection } from '../general/TradingCardSection';

type BuyCardProps = {
    isAmountInputActive: boolean;
    shouldAnimateEntering?: boolean;
};

const BUY_CARD_TEST_ID = '@trading/buyCard';

export const BuyCard = ({ isAmountInputActive, shouldAnimateEntering }: BuyCardProps) => {
    const { watch } = useBuyFormContext();

    const [cryptoValue, asset] = watch(['cryptoValue', 'asset']);

    return (
        <TradingCard
            isAmountInputActive={isAmountInputActive}
            shouldAnimateEntering={shouldAnimateEntering}
        >
            <TradingCardSection
                bottomBorder
                testID={`${BUY_CARD_TEST_ID}/fiatSection`}
                title={<Translation id="moduleTrading.selectFiat.buy.title" />}
                titleAction={
                    <Box alignItems="flex-end">
                        <BuyFormFieldErrorBadge fieldName="fiatValue" />
                    </Box>
                }
            >
                <BuyFiatCurrencyPicker />
            </TradingCardSection>
            <TradingCardSection
                bottomBorder={!!asset}
                testID={`${BUY_CARD_TEST_ID}/cryptoSection`}
                title={<Translation id="moduleTrading.selectCoin.title" />}
                titleAction={
                    <BuyFormFieldErrorBadge fieldName="cryptoValue">
                        <CryptoToFiatValueBadge amount={cryptoValue} cryptoId={asset?.cryptoId} />
                    </BuyFormFieldErrorBadge>
                }
            >
                <BuyTradeableAssetPicker />
                <HStack justifyContent="space-between" alignItems="center" spacing="sp4">
                    <TradeableAssetNetworkInfo asset={asset} />
                    <BuyReceiveAccountCryptoBalance />
                </HStack>
            </TradingCardSection>
            <BuyReceiveAccountPicker />
        </TradingCard>
    );
};
