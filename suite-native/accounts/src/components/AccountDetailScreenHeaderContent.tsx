import { getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import type { Account } from '@suite-common/wallet-types';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';

import { AccountLabel } from './AccountLabel';

type AccountDetailScreenHeaderContentProps = {
    account: Account;
};

export const AccountDetailScreenHeaderContent = ({
    account,
}: AccountDetailScreenHeaderContentProps) => (
    <HStack alignItems="center" flexShrink={1}>
        <TokenIcon
            tokenSymbol={account.symbol}
            networkSymbol={account.symbol}
            size="small"
            showNetworkIcon
        />
        <VStack spacing={0} flexShrink={1}>
            <Text variant="body-md-strong" numberOfLines={1} ellipsizeMode="tail">
                {getNetworkDisplaySymbolName(account.symbol)}
            </Text>
            <AccountLabel
                account={account}
                variant="body-xs"
                color="contentSecondary"
                numberOfLines={1}
                ellipsizeMode="tail"
                showAccountTypeBadge
            />
        </VStack>
    </HStack>
);
