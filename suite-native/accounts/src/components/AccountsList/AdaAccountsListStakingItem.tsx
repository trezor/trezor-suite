import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type AccountsRootState } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { RoundedIcon, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    type NativeStakingRootState,
    selectIsCardanoStakedOutsideEverstake,
    selectIsCardanoStakedWithFiveBinaries,
} from '@suite-native/staking';
import { useNativeStyles } from '@trezor/styles-native';

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
    const isStakedWithFiveBinaries = useSelector((state: AccountsRootState) =>
        selectIsCardanoStakedWithFiveBinaries(state, account.key),
    );

    const icon = useMemo(
        () =>
            isStakedOutsideEverstake ? (
                <Icon name="warning" color="contentWarning" />
            ) : (
                <Icon name="check" color="contentBrand" />
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
                    color="contentSecondary"
                    containerSize={utils.spacings.sp32}
                />
            }
            title={<Translation id="accountList.staking" />}
            secondaryTitle={
                isStakedWithFiveBinaries && (
                    <Text variant="body-sm" color="contentWarning">
                        <Translation id="accountList.rewardsReduced" />
                    </Text>
                )
            }
            mainValue={icon}
            secondaryValue={undefined}
        />
    );
};
