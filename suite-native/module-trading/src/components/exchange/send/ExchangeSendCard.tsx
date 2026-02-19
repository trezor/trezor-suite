import { cryptoIdToSymbol } from '@suite-common/trading';
import { AnimatedCard, HStack, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { CardTitle, useAnimatedBorderStyle } from '@suite-native/trading-atoms';
import { NetworkReserveBanner } from '@suite-native/transaction-management';

import { ExchangeSendAccountCryptoBalance } from './ExchangeSendAccountCryptoBalance';
import { ExchangeSendAmountBadge } from './ExchangeSendAmountBadge';
import { ExchangeSendAssetPicker } from './ExchangeSendAssetPicker';
import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { TradeableAssetNetworkInfo } from '../../general/TradeableAssetNetworkInfo';

export type ExchangeSendCardProps = {
    isAmountInputActive: boolean;
};

export const ExchangeSendCard = ({ isAmountInputActive }: ExchangeSendCardProps) => {
    const animatedStyle = useAnimatedBorderStyle(isAmountInputActive);
    const { watch } = useExchangeFormContext();

    const asset = watch('sendAsset');
    const symbol = asset ? cryptoIdToSymbol(asset.cryptoId) : undefined;

    return (
        <AnimatedCard style={animatedStyle} noPadding>
            <VStack paddingHorizontal="sp12" paddingVertical="sp16">
                <HStack justifyContent="space-between" alignItems="center">
                    <CardTitle>
                        <Translation id="moduleTrading.selectCoinToSell.title" />
                    </CardTitle>
                    <ExchangeSendAmountBadge />
                </HStack>
                <ExchangeSendAssetPicker />
                <HStack
                    justifyContent="space-between"
                    alignItems="center"
                    paddingVertical="sp4"
                    spacing="sp4"
                >
                    <TradeableAssetNetworkInfo asset={asset} />
                    <ExchangeSendAccountCryptoBalance />
                </HStack>
                {symbol && (
                    <NetworkReserveBanner
                        symbol={symbol}
                        contractAddress={asset?.contractAddress}
                    />
                )}
            </VStack>
        </AnimatedCard>
    );
};
