import { useSelector } from 'react-redux';

import { useFormatters } from '@suite-common/formatters';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { AccountLabel } from '@suite-native/accounts';
import { HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { type TransactionSubtitleProps } from '@suite-native/transactions';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const accountLabelStyle = prepareNativeStyle(_ => ({
    flexShrink: 1,
}));

export const AssetTransactionSubtitle = ({ accountKey, blockTime }: TransactionSubtitleProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const { applyStyle } = useNativeStyles();
    const { TimeFormatter } = useFormatters();

    if (!account) {
        return null;
    }

    return (
        <HStack alignItems="center" spacing="sp4">
            <Icon name="wallet" size="medium" color="contentSecondary" />
            <AccountLabel
                account={account}
                variant="body-sm"
                color="contentSecondary"
                numberOfLines={1}
                style={applyStyle(accountLabelStyle)}
            />
            {blockTime !== null && (
                <Text variant="body-sm" color="contentSecondary">
                    {`· ${TimeFormatter.format(blockTime)}`}
                </Text>
            )}
        </HStack>
    );
};
