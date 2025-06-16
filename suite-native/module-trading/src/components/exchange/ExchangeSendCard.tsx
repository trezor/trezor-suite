import { useEffect } from 'react';

import { CryptoId } from 'invity-api';

import { TokenAddress } from '@suite-common/wallet-types';
import { AnimatedCard, HStack, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { ExchangeSendAccountCryptoBalance } from './ExchangeSendAccountCryptoBalance';
import { ExchangeSendAssetPicker } from './ExchangeSendAssetPicker';
import { useExchangeFormContext } from '../../hooks/exchange/useExchangeFormContext';
import { useAnimatedBorderStyle } from '../../hooks/general/useAnimatedBorderStyle';
import { TradeableAsset } from '../../types/general';
import { CardTitle } from '../general/CardTitle';
import { FiatAmountBadge } from '../general/FiatAmountBadge';
import { TradeableAssetNetworkInfo } from '../general/TradeableAssetNetworkInfo';

export type ExchangeSendCardProps = {
    isAmountInputActive: boolean;
};

const usdcAssetMock: TradeableAsset = {
    symbol: 'usdc',
    name: 'USDC',
    coingeckoId: 'usd-coin',
    cryptoId: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CryptoId,
    networkId: 'ethereum',
    contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress,
};

const useMockedAsset = () => {
    const { setValue } = useExchangeFormContext();

    useEffect(() => {
        setValue('sendAsset', usdcAssetMock);
    }, [setValue]);
};

export const ExchangeSendCard = ({ isAmountInputActive }: ExchangeSendCardProps) => {
    const animatedStyle = useAnimatedBorderStyle(isAmountInputActive);
    const { watch } = useExchangeFormContext();

    // TODO temporary mock
    useMockedAsset();

    const asset = watch('sendAsset');

    return (
        <AnimatedCard style={animatedStyle}>
            <VStack>
                <HStack justifyContent="space-between" alignItems="center">
                    <CardTitle>
                        <Translation id="moduleTrading.selectCoinToSell.title" />
                    </CardTitle>
                    <FiatAmountBadge amount="123" />
                </HStack>
            </VStack>
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
        </AnimatedCard>
    );
};
