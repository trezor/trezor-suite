import type { ReactNode } from 'react';

import type { Account } from '@suite-common/wallet-types';
import { AccountLabel } from '@suite-native/accounts';
import { Card, HStack } from '@suite-native/atoms';
import { NetworkLogo } from '@suite-native/icons';

import { TradeInfoHeader } from './TradeInfoHeader';

export type NetworkAndAccountCardProps = {
    title: ReactNode;
    account: Account;
    children?: ReactNode;
};

export const NetworkAndAccountCard = ({ title, account, children }: NetworkAndAccountCardProps) => {
    const { symbol } = account;

    return (
        <Card noPadding>
            <TradeInfoHeader
                title={title}
                rightContent={
                    <HStack alignItems="center">
                        {!!symbol && <NetworkLogo networkSymbol={symbol} size="extraLarge" />}
                        <AccountLabel variant="body-sm" account={account} />
                    </HStack>
                }
            />
            {children}
        </Card>
    );
};
