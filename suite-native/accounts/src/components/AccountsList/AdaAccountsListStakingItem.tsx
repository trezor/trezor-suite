import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { Account } from '@suite-common/wallet-types';
import { RoundedIcon } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { NativeStakingRootState } from '@suite-native/staking';
import { selectIsCardanoStakedOutsideEverstake } from '@suite-native/staking/src/cardanoStakingSelectors';
import { useNativeStyles } from '@trezor/styles';

import { AccountsListItemBase } from './AccountsListItemBase';

type AdaAccountsListStakingItemProps = {
    account: Account;
    stakingCryptoBalance: string;
    onPress: () => void;

    hasBackground?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
};

export const AdaAccountsListStakingItem = ({
    account,
    stakingCryptoBalance,
    isLast,
    ...props
}: AdaAccountsListStakingItemProps) => {
    const { utils } = useNativeStyles();

    const isStakedOutsideEverstake = useSelector((state: NativeStakingRootState) =>
        selectIsCardanoStakedOutsideEverstake(state, account.key),
    );

    const icon = useMemo(
        () =>
            isStakedOutsideEverstake ? (
                <Icon name="warning" color="iconAlertYellow" />
            ) : (
                <Icon name="check" color="iconPrimaryDefault" />
            ),
        [isStakedOutsideEverstake],
    );

    return (
        <AccountsListItemBase
            {...props}
            isLast={isLast}
            showDivider={!isLast}
            icon={
                <RoundedIcon
                    name="piggyBankFilled"
                    color="iconSubdued"
                    containerSize={utils.spacings.sp32}
                />
            }
            title={<Translation id="accountList.staking" />}
            mainValue={icon}
            secondaryValue={undefined}
        />
    );
};
