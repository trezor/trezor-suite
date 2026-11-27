import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type StakingRootState, selectStakingAccountNotice } from '@suite-common/earn-staking';
import { type Account } from '@suite-common/wallet-types';
import { IconCircle } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { AccountsListItemBase } from './AccountsListItemBase';
import { ExternalPoolBadge } from './ExternalPoolBadge';
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
    const notice = useSelector((state: StakingRootState) =>
        selectStakingAccountNotice(state, account.key),
    );

    const mainValue = useMemo(() => {
        if (notice?.kind === 'outdated-provider') {
            return <ZeroApyBadge />;
        }
        if (notice?.kind === 'external-provider') {
            return <ExternalPoolBadge />;
        }

        return notice?.kind === 'no-stake-pool' ? (
            <Icon name="info" color="contentInfo" testID="@accountList/item/stakingNoPool" />
        ) : (
            <Icon name="check" color="contentBrand" />
        );
    }, [notice]);

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
