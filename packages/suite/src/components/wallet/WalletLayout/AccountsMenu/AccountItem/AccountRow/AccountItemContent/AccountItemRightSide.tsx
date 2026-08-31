import { useSelector } from '@suite-common/redux-utils';
import { selectCardanoPoolsInfo } from '@suite-common/wallet-core';
import { type Account, type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { isCardanoStakedWithEverstake } from '@suite-common/wallet-utils';
import { Icon, Text } from '@trezor/components';
import { CheckIcon, WarningIcon } from '@trezor/icons';

import { BaseCurrency } from './BaseCurrency';

const ICON_SIZE = 16;

type AccountItemRightSideProps = {
    account: Account;
    isCardanoStakingRow: boolean;
    isTronStakingRowWithActiveVotes: boolean;
    isFailed: boolean;
    formattedBalance: string;
    customFiatValue?: BaseCurrencyAmount;
    isFiatLoading?: boolean;
};

export const AccountItemRightSide = ({
    account,
    isCardanoStakingRow,
    isTronStakingRowWithActiveVotes,
    isFailed,
    formattedBalance,
    customFiatValue,
    isFiatLoading,
}: AccountItemRightSideProps) => {
    const cardanoStakingPools = useSelector(selectCardanoPoolsInfo);

    if (isCardanoStakingRow) {
        const isEverstake = isCardanoStakedWithEverstake(account, cardanoStakingPools);

        return (
            <Icon
                as={isEverstake ? CheckIcon : WarningIcon}
                intent={isEverstake ? 'brand' : 'warning'}
                size={ICON_SIZE}
            />
        );
    }

    if (isTronStakingRowWithActiveVotes) {
        return <Icon as={WarningIcon} intent="warning" size={ICON_SIZE} />;
    }

    if (isFailed) {
        return <Icon as={WarningIcon} size={ICON_SIZE} intent="warning" />;
    }

    return (
        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
            <BaseCurrency
                isLoading={isFiatLoading}
                customFiatValue={customFiatValue}
                symbol={account.symbol}
                formattedBalance={formattedBalance}
            />
        </Text>
    );
};
