import { selectIsDiscreteModeActive } from '@suite-common/wallet-core';
import { type Account, type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { Column, Row, Text } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { type AccountItemType } from 'src/types/wallet';

import { AccountItemBottomLine } from './AccountItemBottomLine';
import { AccountItemLabel } from './AccountItemLabel';
import { AccountItemRightSide } from './AccountItemRightSide';

type AccountItemContentProps = {
    customFiatValue?: BaseCurrencyAmount;
    account: Account;
    type: AccountItemType;
    formattedBalance: string;
    dataTestKey?: string;
    isFiatLoading?: boolean;
};

export const AccountItemContent = ({
    customFiatValue,
    account,
    type,
    formattedBalance,
    dataTestKey,
    isFiatLoading,
}: AccountItemContentProps) => {
    const discreetMode = useSelector(selectIsDiscreteModeActive);

    const isCardanoStakingRow = account.networkType === 'cardano' && type === 'staking';
    const isFailed = !!account.failed;

    const canShowBalance = account.backendType !== 'coinjoin' || account.status !== 'initial';

    const shouldShowCryptoBalance =
        !isCardanoStakingRow && !isFailed && canShowBalance && type !== 'tokens';

    const shouldShowBalancePlaceholder = !isCardanoStakingRow && !isFailed && !canShowBalance;

    return (
        // Content is constant size in discreet mode, so overflow: hidden is unnecessary.
        // Though it would cut off CSS blur effect, so we may turn it off
        <Column
            flex="1"
            overflow={discreetMode ? 'visible' : 'hidden'}
            gap={2}
            alignItems="flex-start"
        >
            <Row gap={16} justifyContent="space-between" width="100%">
                <Text
                    typographyStyle="body-sm"
                    ellipsisLineCount={1}
                    data-testid={`${dataTestKey}/label`}
                >
                    <AccountItemLabel account={account} type={type} />
                </Text>

                <AccountItemRightSide
                    account={account}
                    isCardanoStakingRow={isCardanoStakingRow}
                    isFailed={isFailed}
                    formattedBalance={formattedBalance}
                    customFiatValue={customFiatValue}
                    isFiatLoading={isFiatLoading}
                />
            </Row>

            <AccountItemBottomLine
                account={account}
                formattedBalance={formattedBalance}
                shouldShowCryptoBalance={shouldShowCryptoBalance}
                shouldShowBalancePlaceholder={shouldShowBalancePlaceholder}
            />
        </Column>
    );
};
