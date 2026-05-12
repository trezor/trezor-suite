import { useSelector } from 'react-redux';

import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { type NativeAccountsRootState, selectAccountFiatBalance } from '@suite-native/accounts';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { CryptoIconWithNetwork } from '@suite-native/icons';
import { AccountLabel } from '@suite-native/labeling';
import { ScreenHeader } from '@suite-native/navigation';

import { type AccountAssetsFlow } from './types';

type Props = { accountKey: AccountKey; flowType?: AccountAssetsFlow };

const AccountAssetsScreenHeaderContent = ({ accountKey }: Omit<Props, 'flowType'>) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const fiatBalance = useSelector((state: NativeAccountsRootState) =>
        selectAccountFiatBalance(state, accountKey),
    );

    if (!account) return null;

    return (
        <HStack alignItems="center" spacing="sp8">
            <CryptoIconWithNetwork symbol={account.symbol} size="small" />
            <VStack spacing={0} alignItems="flex-start">
                <Text variant="body-md-strong" adjustsFontSizeToFit numberOfLines={1}>
                    <AccountLabel account={account} />
                </Text>
                <BaseCurrencyAmountFormatter
                    value={fiatBalance}
                    variant="body-sm"
                    color="contentSecondary"
                />
            </VStack>
        </HStack>
    );
};

export const AccountAssetsScreenHeader = ({ accountKey, flowType }: Props) => (
    <ScreenHeader
        customContent={<AccountAssetsScreenHeaderContent accountKey={accountKey} />}
        closeActionType={flowType === 'send' ? 'back' : 'close'}
    />
);
