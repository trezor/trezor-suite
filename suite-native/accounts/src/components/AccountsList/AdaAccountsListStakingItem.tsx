import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
    type StakingRootState,
    selectHasStakingAccountWarning,
    selectIsStakingAccountDelegatedOutside,
} from '@suite-common/earn-staking';
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
    const isDelegatedOutside = useSelector((state: StakingRootState) =>
        selectIsStakingAccountDelegatedOutside(state, account.key),
    );
    const hasOutdatedProvider = useSelector((state: StakingRootState) =>
        selectHasStakingAccountWarning(state, account.key, 'outdated-provider'),
    );

    const mainValue = useMemo(() => {
        if (hasOutdatedProvider) {
            return <ZeroApyBadge />;
        }
        if (isDelegatedOutside) {
            return <ExternalPoolBadge />;
        }

        return <Icon name="check" color="contentBrand" />;
    }, [isDelegatedOutside, hasOutdatedProvider]);

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
