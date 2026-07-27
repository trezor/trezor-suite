import { type Account, type TokenAddress, type TokenSymbol } from '@suite-common/wallet-types';
import { Card, HStack, Text } from '@suite-native/atoms';
import { NetworkIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { YieldDepositRevokeDetailsRow } from './YieldDepositRevokeDetailsRow';
import { YieldDepositRevokeLimitValue } from './YieldDepositRevokeLimitValue';

const detailsRowValueStyle = prepareNativeStyle(() => ({
    flexShrink: 1,
    minWidth: 0,
}));

const detailsRowValueTextStyle = prepareNativeStyle(() => ({
    flexShrink: 1,
    minWidth: 0,
}));

type YieldDepositRevokeDetailsCardProps = {
    account: Account;
    accountLabel: string;
    approvedAmount: string | null;
    isApprovedAmountUnlimited: boolean;
    providerName: string;
    tokenContract: TokenAddress;
    tokenSymbol: TokenSymbol;
};

export const YieldDepositRevokeDetailsCard = ({
    account,
    accountLabel,
    approvedAmount,
    isApprovedAmountUnlimited,
    providerName,
    tokenContract,
    tokenSymbol,
}: YieldDepositRevokeDetailsCardProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Card noPadding>
            <YieldDepositRevokeDetailsRow
                isFirst
                label={<Translation id="earn.yieldDepositRevokeScreen.account" />}
            >
                <HStack
                    alignItems="center"
                    spacing="sp8"
                    flexShrink={1}
                    style={applyStyle(detailsRowValueStyle)}
                >
                    <NetworkIcon symbol={account.symbol} size={20} />
                    <Text
                        color="contentPrimary"
                        ellipsizeMode="tail"
                        numberOfLines={1}
                        style={applyStyle(detailsRowValueTextStyle)}
                        variant="body-sm"
                    >
                        {accountLabel}
                    </Text>
                </HStack>
            </YieldDepositRevokeDetailsRow>

            <YieldDepositRevokeDetailsRow
                label={<Translation id="earn.yieldDepositRevokeScreen.provider" />}
            >
                <Text
                    color="contentPrimary"
                    ellipsizeMode="tail"
                    numberOfLines={1}
                    style={applyStyle(detailsRowValueTextStyle)}
                    variant="body-sm"
                >
                    {providerName}
                </Text>
            </YieldDepositRevokeDetailsRow>

            <YieldDepositRevokeDetailsRow
                label={<Translation id="earn.yieldDepositRevokeScreen.limit" />}
            >
                <YieldDepositRevokeLimitValue
                    approvedAmount={approvedAmount}
                    isApprovedAmountUnlimited={isApprovedAmountUnlimited}
                    networkSymbol={account.symbol}
                    tokenContract={tokenContract}
                    tokenSymbol={tokenSymbol}
                />
            </YieldDepositRevokeDetailsRow>
        </Card>
    );
};
