import { useSelector } from 'react-redux';

import {
    type StakeRootState,
    selectAccountByKey,
    selectTronPendingUnstakeBalanceByAccountKey,
    selectUnstakingPeriodInDaysByAccountKey,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Box, Card, Text } from '@suite-native/atoms';
import {
    CompactCryptoAmountFormatter,
    CryptoToFiatAmountFormatter,
} from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';

interface TronStakingUnstakeCardProps {
    accountKey: AccountKey;
}

export const TronStakingUnstakeCard = ({ accountKey }: TronStakingUnstakeCardProps) => {
    const account = useSelector((state: StakeRootState) => selectAccountByKey(state, accountKey));

    const pendingUnstakeBalance = useSelector((state: StakeRootState) =>
        selectTronPendingUnstakeBalanceByAccountKey(state, accountKey),
    );
    const unstakingPeriodInDays = useSelector((state: StakeRootState) =>
        selectUnstakingPeriodInDaysByAccountKey(state, accountKey),
    );

    if (account?.networkType !== 'tron') return null;
    if (pendingUnstakeBalance === '0') return null;

    return (
        <Card>
            <Box flexDirection="row" alignItems="center" justifyContent="space-between">
                <Text variant="body-sm-strong">
                    <Translation
                        id="earn.tron.unstakingCardTitle"
                        values={{ days: unstakingPeriodInDays ?? 14 }}
                    />
                </Text>

                <Box flexDirection="column" alignItems="flex-end">
                    <CompactCryptoAmountFormatter
                        value={pendingUnstakeBalance}
                        symbol={account.symbol}
                        variant="body-sm"
                        color="contentPrimary"
                    />

                    <CryptoToFiatAmountFormatter
                        value={pendingUnstakeBalance}
                        symbol={account.symbol}
                        isBalance
                        variant="body-sm"
                        color="contentSecondary"
                    />
                </Box>
            </Box>
        </Card>
    );
};
