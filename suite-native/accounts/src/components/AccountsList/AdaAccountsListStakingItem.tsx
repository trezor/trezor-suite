import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
    type StakeRootState,
    selectIsCardanoStakedOutsideEverstake,
    selectIsCardanoStakedWithFiveBinaries,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { IconCircle } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { AccountsListItemBase } from './AccountsListItemBase';
import { ZeroApyBadge } from './ZeroApyBadge';

type AdaAccountsListStakingItemProps = {
    account: Account;
    stakingCryptoBalance: string;
    onPress: () => void;

    hasBackground?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
    badges?: React.ReactNode;
};

export const AdaAccountsListStakingItem = ({
    account,
    stakingCryptoBalance,
    isLast,
    badges,
    ...props
}: AdaAccountsListStakingItemProps) => {
    const isStakedOutsideEverstake = useSelector((state: StakeRootState) =>
        selectIsCardanoStakedOutsideEverstake(state, account.key),
    );
    const isStakedWithFiveBinaries = useSelector((state: StakeRootState) =>
        selectIsCardanoStakedWithFiveBinaries(state, account.key),
    );

    const mainValue = useMemo(() => {
        if (isStakedWithFiveBinaries) {
            return <ZeroApyBadge />;
        }
        if (isStakedOutsideEverstake) {
            return <Icon name="warning" color="contentWarning" />;
        }

        return <Icon name="check" color="contentBrand" />;
    }, [isStakedOutsideEverstake, isStakedWithFiveBinaries]);

    return (
        <AccountsListItemBase
            {...props}
            isLast={isLast}
            showDivider={!isLast}
            icon={<IconCircle name="piggyBankFilled" intent="neutral" size={32} />}
            title={<Translation id="accountList.staking" />}
            mainValue={mainValue}
            secondaryValue={undefined}
            badges={badges}
        />
    );
};
