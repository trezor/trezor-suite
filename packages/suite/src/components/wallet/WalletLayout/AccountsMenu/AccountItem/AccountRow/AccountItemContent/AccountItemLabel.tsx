import { AccountLabel } from '@suite/account';
import { Translation } from '@suite/intl';
import { isCardanoStakedWithFiveBinaries } from '@suite-common/staking';
import { type Account } from '@suite-common/wallet-types';
import { Column, Text } from '@trezor/components';

import { type AccountItemType } from 'src/types/wallet';

type AccountItemLabelProps = {
    account: Account;
    type: AccountItemType;
    showAccountTypeBadge?: boolean;
};

export const AccountItemLabel = ({
    account,
    type,
    showAccountTypeBadge,
}: AccountItemLabelProps) => {
    switch (type) {
        case 'coin':
            return (
                <AccountLabel
                    account={account}
                    showAccountTypeBadge={showAccountTypeBadge}
                    accountTypeBadgeSize="small"
                />
            );

        case 'staking':
            return (
                <Column alignItems="flex-start">
                    <Translation id="TR_NAV_STAKING" />
                    {isCardanoStakedWithFiveBinaries(account) && (
                        <Text typographyStyle="body-sm" intent="warning">
                            <Translation id="TR_STAKING_REWARDS_REDUCED" />
                        </Text>
                    )}
                </Column>
            );

        case 'tokens':
            return <Translation id="TR_NAV_TOKENS" />;

        default:
            return null;
    }
};
