import { useSelector } from 'react-redux';

import { cryptoIdToSymbol } from '@suite-common/trading';
import { type AccountsRootState, selectAccountFormattedBalance } from '@suite-common/wallet-core';
import { Box, HStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    NetworkReserveBanner,
    useIsNetworkReserveBannerVisible,
} from '@suite-native/transaction-management';

import { SellFormFieldErrorBadge } from './SellFormFieldErrorBadge';
import { useSellFormContext } from '../../hooks/sell/useSellFormContext';
import { TradeableAssetNetworkInfo } from '../general/TradeableAssetNetworkInfo';
import { TradingCard } from '../general/TradingCard';
import { TradingCardSection } from '../general/TradingCardSection';
import { SellFiatCurrencyPicker } from './fiat/SellFiatCurrencyPicker';
import { SellReceiveMethodPicker } from './fiat/SellReceiveMethodPicker';
import { SellSendAccountCryptoBalance } from './send/SellSendAccountCryptoBalance';
import { SellSendAssetPicker } from './send/SellSendAssetPicker';

type SellCardProps = {
    isAmountInputActive: boolean;
    shouldAnimateEntering?: boolean;
};

const SELL_CARD_TEST_ID = '@trading/sellCard';

export const SellCard = ({ isAmountInputActive, shouldAnimateEntering }: SellCardProps) => {
    const { watch } = useSellFormContext();

    const asset = watch('sendAsset');
    const cryptoStringAmount = watch('cryptoStringAmount');
    const sendAccount = watch('sendAccount');
    const symbol = asset ? cryptoIdToSymbol(asset.cryptoId) : undefined;

    const formattedBalance = useSelector((state: AccountsRootState) =>
        selectAccountFormattedBalance(state, sendAccount?.key),
    );

    const shouldShowBanner = useIsNetworkReserveBannerVisible({
        symbol,
        contractAddress: asset?.contractAddress,
        amount: cryptoStringAmount,
        balance: formattedBalance,
    });

    return (
        <TradingCard
            isAmountInputActive={isAmountInputActive}
            shouldAnimateEntering={shouldAnimateEntering}
        >
            <TradingCardSection
                bottomBorder
                testID={`${SELL_CARD_TEST_ID}/cryptoSection`}
                title={<Translation id="moduleTrading.selectCoinToSell.title" />}
                titleAction={
                    <Box alignItems="flex-end">
                        <SellFormFieldErrorBadge fieldName="cryptoStringAmount" />
                    </Box>
                }
            >
                <SellSendAssetPicker />
                <HStack justifyContent="space-between" alignItems="center" spacing="sp4">
                    <TradeableAssetNetworkInfo asset={asset} />
                    <SellSendAccountCryptoBalance />
                </HStack>
                {symbol && shouldShowBanner && (
                    <NetworkReserveBanner
                        symbol={symbol}
                        contractAddress={asset?.contractAddress}
                    />
                )}
            </TradingCardSection>
            <TradingCardSection
                testID={`${SELL_CARD_TEST_ID}/fiatSection`}
                title={<Translation id="moduleTrading.selectFiat.sell.title" />}
                titleAction={
                    <Box alignItems="flex-end">
                        <SellFormFieldErrorBadge fieldName="fiatStringAmount" />
                    </Box>
                }
            >
                <SellFiatCurrencyPicker />
            </TradingCardSection>
            <SellReceiveMethodPicker />
        </TradingCard>
    );
};
