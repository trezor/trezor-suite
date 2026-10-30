import { useSelector } from 'react-redux';

import { useFormatters } from '@suite-common/formatters';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { AccountLabel } from '@suite-native/accounts';
import { DiscreetText, HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const accountLabelStyle = prepareNativeStyle(_ => ({
    flexShrink: 1,
}));

type TransactionListItemAccountLineProps = {
    accountKey: AccountKey;
    blockTime: number | null;
    isPhishingTransaction: boolean;
};

export const TransactionListItemAccountLine = ({
    accountKey,
    blockTime,
    isPhishingTransaction,
}: TransactionListItemAccountLineProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const { applyStyle } = useNativeStyles();
    const { TimeFormatter } = useFormatters();

    if (!account) {
        return null;
    }

    const TimeTextComponent = isPhishingTransaction ? DiscreetText : Text;

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
                <TimeTextComponent
                    isForcedDiscreetMode={isPhishingTransaction}
                    variant="body-sm"
                    color="contentSecondary"
                >
                    {`· ${TimeFormatter.format(blockTime)}`}
                </TimeTextComponent>
            )}
        </HStack>
    );
};
