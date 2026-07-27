import { type Account, type TokenAddress, type TokenSymbol } from '@suite-common/wallet-types';
import { HStack, Text } from '@suite-native/atoms';
import { Icon, TokenIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const detailsRowValueStyle = prepareNativeStyle(() => ({
    flexShrink: 1,
    minWidth: 0,
}));

const detailsRowValueTextStyle = prepareNativeStyle(() => ({
    flexShrink: 1,
    minWidth: 0,
}));

type YieldDepositRevokeLimitValueProps = {
    approvedAmount: string | null;
    isApprovedAmountUnlimited: boolean;
    networkSymbol: Account['symbol'];
    tokenContract: TokenAddress;
    tokenSymbol: TokenSymbol;
};

export const YieldDepositRevokeLimitValue = ({
    approvedAmount,
    isApprovedAmountUnlimited,
    networkSymbol,
    tokenContract,
    tokenSymbol,
}: YieldDepositRevokeLimitValueProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <HStack
            alignItems="center"
            flexShrink={1}
            spacing="sp4"
            style={applyStyle(detailsRowValueStyle)}
        >
            <TokenIcon symbol={networkSymbol} contractAddress={tokenContract} size="extraSmall" />
            <Text
                color="contentPrimary"
                ellipsizeMode="tail"
                numberOfLines={1}
                style={applyStyle(detailsRowValueTextStyle)}
                variant="body-sm-strong"
            >
                {isApprovedAmountUnlimited ? (
                    <>
                        <Translation id="earn.yieldDepositFlowScreen.approvalLimitSheet.unlimited.title" />{' '}
                        {tokenSymbol}
                    </>
                ) : (
                    approvedAmount
                )}
            </Text>
            <Icon name="arrowRight" size="medium" color="contentSecondary" />
            <Text color="contentPrimary" variant="body-sm-strong">
                0 {tokenSymbol}
            </Text>
        </HStack>
    );
};
