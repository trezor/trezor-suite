import { selectCardanoPoolsInfo, selectIsDiscreteModeActive } from '@suite-common/wallet-core';
import { Account, BaseCurrencyAmount } from '@suite-common/wallet-types';
import {
    isCardanoStakedWithEverstake,
    isCardanoStakedWithFiveBinaries,
} from '@suite-common/wallet-utils';
import { Column, Icon, Row, Text } from '@trezor/components';

import { AccountLabel, CoinBalance } from 'src/components/suite';
import { Translation } from 'src/components/suite/Translation';
import { useSelector } from 'src/hooks/suite';
import { AccountItemType } from 'src/types/wallet';

import { BalancePlaceholder } from './BalancePlaceholder';
import { BaseCurrency } from './BaseCurrency';

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
    const cardanoStakingPools = useSelector(selectCardanoPoolsInfo);
    const isCardanoStaking = account.networkType === 'cardano' && type === 'staking';
    const isBalanceShown = account.backendType !== 'coinjoin' || account.status !== 'initial';

    const cardanoStakingIcon = isCardanoStakedWithEverstake(account, cardanoStakingPools) ? (
        <Icon name="check" variant="primary" size={16} />
    ) : (
        <Icon name="warning" variant="warning" size={16} />
    );

    return (
        // Content is constant size in discreet mode, so overflow: hidden is unnecessary.
        // Though it would cut off CSS blur effect, so we may turn it off
        <Column flex="1" overflow={discreetMode ? 'visible' : 'hidden'} gap={2}>
            <Row gap={16} justifyContent="space-between">
                <Text
                    typographyStyle="hint"
                    ellipsisLineCount={1}
                    data-testid={`${dataTestKey}/label`}
                >
                    {type === 'coin' && <AccountLabel account={account} />}
                    {type === 'staking' && (
                        <Column alignItems="flex-start">
                            <Translation id="TR_NAV_STAKING" />
                            {isCardanoStakedWithFiveBinaries(account) && (
                                <Text typographyStyle="hint" variant="warning">
                                    <Translation id="TR_STAKING_REWARDS_REDUCED" />
                                </Text>
                            )}
                        </Column>
                    )}
                    {type === 'tokens' && <Translation id="TR_NAV_TOKENS" />}
                </Text>

                {!isCardanoStaking ? (
                    <Text typographyStyle="hint" variant="tertiary">
                        <BaseCurrency
                            isLoading={isFiatLoading}
                            customFiatValue={customFiatValue}
                            symbol={account.symbol}
                            formattedBalance={formattedBalance}
                        />
                    </Text>
                ) : (
                    cardanoStakingIcon
                )}
            </Row>
            {!isCardanoStaking && (
                <>
                    {isBalanceShown && type !== 'tokens' && (
                        <Text typographyStyle="hint" variant="tertiary">
                            <CoinBalance
                                data-testid="@wallet"
                                value={formattedBalance}
                                symbol={account.symbol}
                                showApproximation
                            />
                        </Text>
                    )}
                    {!isBalanceShown && <BalancePlaceholder networkSymbol={account.symbol} />}
                </>
            )}
        </Column>
    );
};
