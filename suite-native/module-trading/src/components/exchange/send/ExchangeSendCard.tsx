import { asBaseCurrencyAmount } from '@suite-common/wallet-utils';
import { AnimatedCard, HStack, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { BigNumber } from '@trezor/utils';

import { ExchangeSendAccountCryptoBalance } from './ExchangeSendAccountCryptoBalance';
import { ExchangeSendAssetPicker } from './ExchangeSendAssetPicker';
import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { useAnimatedBorderStyle } from '../../../hooks/general/useAnimatedBorderStyle';
import { CardTitle } from '../../general/CardTitle';
import { FiatAmountBadge } from '../../general/FiatAmountBadge';
import { TradeableAssetNetworkInfo } from '../../general/TradeableAssetNetworkInfo';

export type ExchangeSendCardProps = {
    isAmountInputActive: boolean;
};

export const ExchangeSendCard = ({ isAmountInputActive }: ExchangeSendCardProps) => {
    const animatedStyle = useAnimatedBorderStyle(isAmountInputActive);
    const { watch } = useExchangeFormContext();

    const asset = watch('sendAsset');

    return (
        <AnimatedCard style={animatedStyle}>
            <VStack>
                <HStack justifyContent="space-between" alignItems="center">
                    <CardTitle>
                        <Translation id="moduleTrading.selectCoinToSell.title" />
                    </CardTitle>
                    <FiatAmountBadge amount={asBaseCurrencyAmount(new BigNumber('123'))} />
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
            </VStack>
        </AnimatedCard>
    );
};
