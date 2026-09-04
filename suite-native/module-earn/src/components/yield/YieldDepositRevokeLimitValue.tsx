import { type Account, type TokenAddress, type TokenSymbol } from '@suite-common/wallet-types';
import { HStack, Text } from '@suite-native/atoms';
import { Icon, TokenIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { YieldFormattedAmount } from './YieldFormattedAmount';

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
    tokenDecimals?: number;
    tokenContract: TokenAddress;
    tokenSymbol: TokenSymbol;
};

export const YieldDepositRevokeLimitValue = ({
    approvedAmount,
    isApprovedAmountUnlimited,
    networkSymbol,
    tokenDecimals,
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
            {isApprovedAmountUnlimited ? (
                <Text
                    color="contentPrimary"
                    ellipsizeMode="tail"
                    numberOfLines={1}
                    style={applyStyle(detailsRowValueTextStyle)}
                    variant="body-sm-strong"
                >
                    <>
                        <Translation id="earn.yieldDepositFlowScreen.approvalLimitSheet.unlimited.title" />{' '}
                        {tokenSymbol}
                    </>
                </Text>
            ) : null}
            {!isApprovedAmountUnlimited && approvedAmount ? (
                <YieldFormattedAmount
                    value={approvedAmount}
                    networkSymbol={networkSymbol}
                    tokenContract={tokenContract}
                    tokenDecimals={tokenDecimals}
                    tokenSymbol={tokenSymbol}
                    variant="body-sm-strong"
                    color="contentPrimary"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={applyStyle(detailsRowValueTextStyle)}
                />
            ) : null}
            <Icon name="arrowRight" size="medium" color="contentSecondary" />
            <YieldFormattedAmount
                value="0"
                networkSymbol={networkSymbol}
                tokenContract={tokenContract}
                tokenDecimals={tokenDecimals}
                tokenSymbol={tokenSymbol}
                variant="body-sm-strong"
                color="contentPrimary"
            />
        </HStack>
    );
};
