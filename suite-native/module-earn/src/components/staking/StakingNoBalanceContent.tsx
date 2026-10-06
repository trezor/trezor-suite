import { useSelector } from 'react-redux';

import { useFormatters } from '@suite-common/formatters';
import { getNetworkDisplaySymbol, getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type StakeRootState,
    getStakingLimitsByNetworkSymbol,
    selectAccountByKey,
    selectApy,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Box } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';

import { useEarnNoBalanceActions } from '../../hooks/earn/useEarnNoBalanceActions';
import { EarnAmountCard } from '../earn/EarnAmountCard';
import { EarnNoBalanceCard } from '../earn/EarnNoBalanceCard';
import { EarnNoBalanceFooter } from '../earn/EarnNoBalanceFooter';

type StakingNoBalanceContentProps = {
    accountKey: AccountKey;
};

export const StakingNoBalanceContent = ({ accountKey }: StakingNoBalanceContentProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const apy = useSelector((state: StakeRootState) =>
        selectApy(state, { networkSymbol: account?.symbol, accountKey }),
    );

    const { handleBuyPress, handleReceivePress } = useEarnNoBalanceActions({ accountKey });
    const { CryptoAmountFormatter } = useFormatters();

    if (!account) {
        return null;
    }

    const displaySymbol = getNetworkDisplaySymbol(account.symbol);
    const stakingLimits = getStakingLimitsByNetworkSymbol(account.symbol);

    return (
        <Screen
            header={
                <ScreenHeader
                    title={
                        <Translation
                            id="earn.earnFormScreen.title"
                            values={{ assetName: getNetworkDisplaySymbolName(account.symbol) }}
                        />
                    }
                />
            }
            footer={
                <EarnNoBalanceFooter
                    displaySymbol={displaySymbol}
                    onBuyPress={handleBuyPress}
                    onReceivePress={handleReceivePress}
                />
            }
        >
            <EarnAmountCard accountKey={accountKey} />
            <Box marginTop="sp16">
                <EarnNoBalanceCard
                    apy={apy}
                    title={
                        <Translation id="earn.noBalance.staking.title" values={{ displaySymbol }} />
                    }
                    subtitle={
                        stakingLimits ? (
                            <Translation
                                id="earn.noBalance.staking.subtitle"
                                values={{
                                    minAmount: CryptoAmountFormatter.format(
                                        stakingLimits.MIN_AMOUNT_FOR_STAKING.toString(),
                                        {
                                            symbol: account.symbol,
                                            isBalance: true,
                                            withSymbol: false,
                                        },
                                    ),
                                    displaySymbol,
                                }}
                            />
                        ) : (
                            <Translation
                                id="earn.noBalance.staking.subtitleWithoutMinimum"
                                values={{ displaySymbol }}
                            />
                        )
                    }
                />
            </Box>
        </Screen>
    );
};
