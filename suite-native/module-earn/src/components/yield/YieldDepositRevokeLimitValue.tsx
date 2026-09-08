import { type Account, type TokenAddress, type TokenSymbol } from '@suite-common/wallet-types';
import { HStack, Text } from '@suite-native/atoms';
import { CryptoAmountFormatter } from '@suite-native/formatters';
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
                <CryptoAmountFormatter
                    value={approvedAmount}
                    symbol={networkSymbol}
                    formatStyle="compact-balance"
                    tokenContract={tokenContract}
                    tokenDecimals={tokenDecimals}
                    tokenSymbol={tokenSymbol}
                    isDiscreetText={false}
                    variant="body-sm-strong"
                    color="contentPrimary"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={applyStyle(detailsRowValueTextStyle)}
                />
            ) : null}
            <Icon name="arrowRight" size="medium" color="contentSecondary" />
            <CryptoAmountFormatter
                value="0"
                symbol={networkSymbol}
                formatStyle="compact-balance"
                tokenContract={tokenContract}
                tokenDecimals={tokenDecimals}
                tokenSymbol={tokenSymbol}
                isDiscreetText={false}
                variant="body-sm-strong"
                color="contentPrimary"
            />
        </HStack>
    );
};
