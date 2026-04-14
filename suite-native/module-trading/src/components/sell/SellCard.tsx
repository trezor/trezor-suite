import { Platform } from 'react-native';
import { FadeIn, LinearTransition } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { cryptoIdToSymbol } from '@suite-common/trading';
import { type AccountsRootState, selectAccountFormattedBalance } from '@suite-common/wallet-core';
import { AnimatedBorderCard, AnimatedBox, Box, HStack, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { CardTitle, useAnimatedBorderStyle } from '@suite-native/trading-atoms';
import {
    NetworkReserveBanner,
    useIsNetworkReserveBannerVisible,
} from '@suite-native/transaction-management';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { SellFormFieldErrorBadge } from './SellFormFieldErrorBadge';
import { SellFiatCurrencyPicker } from './fiat/SellFiatCurrencyPicker';
import { SellReceiveMethodPicker } from './fiat/SellReceiveMethodPicker';
import { SellSendAccountCryptoBalance } from './send/SellSendAccountCryptoBalance';
import { SellSendAssetPicker } from './send/SellSendAssetPicker';
import { useSellFormContext } from '../../hooks/sell/useSellFormContext';
import { TradeableAssetNetworkInfo } from '../general/TradeableAssetNetworkInfo';

type SellCardProps = {
    isAmountInputActive: boolean;
    shouldAnimateEntering?: boolean;
};

const SELL_CARD_TEST_ID = '@trading/sellCard';

const sellSectionStyle = prepareNativeStyle<{ bottomBorder: boolean }>(
    ({ borders, colors, spacings }, { bottomBorder }) => ({
        borderBottomWidth: bottomBorder ? borders.widths.small : 0,
        borderBottomColor: colors.surfaceFillPage,
        paddingHorizontal: spacings.sp12,
        paddingTop: spacings.sp16,
        paddingBottom: spacings.sp12,
        gap: spacings.sp8,
    }),
);

export const SellCard = ({ isAmountInputActive, shouldAnimateEntering }: SellCardProps) => {
    const { applyStyle } = useNativeStyles();
    const animatedStyle = useAnimatedBorderStyle(isAmountInputActive);
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

    // on android fade animation looks ugly on view with shadows, better to skip it
    const enteringAnimation = shouldAnimateEntering && Platform.OS === 'ios' ? FadeIn : undefined;

    return (
        <AnimatedBox entering={enteringAnimation} layout={LinearTransition}>
            <AnimatedBorderCard style={animatedStyle} noPadding>
                <VStack style={applyStyle(sellSectionStyle, { bottomBorder: true })}>
                    <HStack
                        justifyContent="space-between"
                        alignItems="center"
                        testID={SELL_CARD_TEST_ID + '/cryptoSection'}
                    >
                        <CardTitle>
                            <Translation id="moduleTrading.selectCoinToSell.title" />
                        </CardTitle>
                        <Box alignItems="flex-end">
                            <SellFormFieldErrorBadge fieldName="cryptoStringAmount" />
                        </Box>
                    </HStack>
                    <SellSendAssetPicker />
                    <HStack
                        justifyContent="space-between"
                        alignItems="center"
                        paddingVertical="sp4"
                        spacing="sp4"
                    >
                        <TradeableAssetNetworkInfo asset={asset} />
                        <SellSendAccountCryptoBalance />
                    </HStack>
                    {symbol && shouldShowBanner && (
                        <NetworkReserveBanner
                            symbol={symbol}
                            contractAddress={asset?.contractAddress}
                        />
                    )}
                </VStack>
                <VStack style={applyStyle(sellSectionStyle, { bottomBorder: false })}>
                    <HStack
                        justifyContent="space-between"
                        alignItems="center"
                        testID={SELL_CARD_TEST_ID + '/fiatSection'}
                    >
                        <CardTitle>
                            <Translation id="moduleTrading.selectFiat.sell.title" />
                        </CardTitle>
                        <Box alignItems="flex-end">
                            <SellFormFieldErrorBadge fieldName="fiatStringAmount" />
                        </Box>
                    </HStack>
                    <SellFiatCurrencyPicker />
                </VStack>
                <SellReceiveMethodPicker />
            </AnimatedBorderCard>
        </AnimatedBox>
    );
};
