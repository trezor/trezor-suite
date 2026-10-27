import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TronResourceType } from '@suite-common/wallet-types';
import { Box, HStack, Text, VStack } from '@suite-native/atoms';
import {
    CompactCryptoAmountFormatter,
    CryptoToFiatAmountFormatter,
} from '@suite-native/formatters';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type TitleStyleProps = {
    isVisible: boolean;
};

const titleStyle = prepareNativeStyle<TitleStyleProps>((_, { isVisible }) => ({
    opacity: isVisible ? 1 : 0,
}));

const RESOURCE_LABELS: Record<TronResourceType, TxKeyPath> = {
    bandwidth: 'earn.tron.resources.bandwidth',
    energy: 'earn.tron.resources.energy',
};

type TronStakingUnstakeRowProps = {
    index: number;
    amount: string;
    daysLocked: number;
    resource: TronResourceType | undefined;
    symbol: NetworkSymbol;
};

export const TronStakingUnstakeRow = ({
    index,
    amount,
    daysLocked,
    resource,
    symbol,
}: TronStakingUnstakeRowProps) => {
    const { applyStyle } = useNativeStyles();

    const isTitleVisible = index === 0;

    return (
        <HStack
            alignItems="center"
            paddingHorizontal="sp16"
            paddingVertical="sp12"
            spacing="sp16"
            testID={`@staking/tron-unstaking-card/row-${index}`}
        >
            <Box
                style={applyStyle(titleStyle, { isVisible: isTitleVisible })}
                accessibilityElementsHidden={!isTitleVisible}
                importantForAccessibility={isTitleVisible ? 'auto' : 'no-hide-descendants'}
            >
                <Text variant="body-sm-strong">
                    <Translation id="earn.tron.unstakingCard.title" />
                </Text>
            </Box>

            <Box flex={1}>
                <Text variant="body-sm" color="contentSecondary">
                    <Translation
                        id="earn.tron.unstakingCard.daysLocked"
                        values={{ days: daysLocked }}
                    />
                </Text>
            </Box>

            <VStack alignItems="flex-end" spacing="sp2">
                <CompactCryptoAmountFormatter
                    value={amount}
                    symbol={symbol}
                    color="contentPrimary"
                    variant="body-sm"
                />

                {resource ? (
                    <Text variant="body-sm" color="contentSecondary">
                        <Translation id={RESOURCE_LABELS[resource]} />
                    </Text>
                ) : (
                    <CryptoToFiatAmountFormatter
                        value={amount}
                        symbol={symbol}
                        color="contentSecondary"
                        variant="body-sm"
                        isBalance
                    />
                )}
            </VStack>
        </HStack>
    );
};
