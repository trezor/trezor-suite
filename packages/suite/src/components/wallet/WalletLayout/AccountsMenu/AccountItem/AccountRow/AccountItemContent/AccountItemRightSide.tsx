import { selectCardanoPoolsInfo } from '@suite-common/wallet-core';
import { type Account, type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { isCardanoStakedWithEverstake } from '@suite-common/wallet-utils';
import { Icon, Text } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

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
                name={isEverstake ? 'check' : 'warning'}
                intent={isEverstake ? 'brand' : 'warning'}
                size={ICON_SIZE}
            />
        );
    }

    if (isTronStakingRowWithActiveVotes) {
        return <Icon name="warning" intent="warning" size={ICON_SIZE} />;
    }

    if (isFailed) {
        return <Icon name="warning" intent="warning" size={ICON_SIZE} />;
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
