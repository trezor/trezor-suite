import { Translation } from '@suite/intl';
import { type Account } from '@suite-common/wallet-types';
import { isCardanoStakedWithFiveBinaries } from '@suite-common/wallet-utils';
import { Column, Text } from '@trezor/components';

import { AccountLabel } from 'src/components/suite';
import { type AccountItemType } from 'src/types/wallet';

type AccountItemLabelProps = {
    account: Account;
    type: AccountItemType;
};

export const AccountItemLabel = ({ account, type }: AccountItemLabelProps) => {
    switch (type) {
        case 'coin':
            return <AccountLabel account={account} />;

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
