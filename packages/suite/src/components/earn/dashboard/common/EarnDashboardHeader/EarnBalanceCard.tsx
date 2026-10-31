import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import {
    selectEarnTotalFiatAmount,
    selectIsEarnFiatTotalIncomplete,
    selectIsEarnFiatTotalUnavailable,
    useEarnMissingRateTickersQuery,
    useYieldOpportunities,
} from '@suite-common/wallet-core';
import { Card, Column, Skeleton, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { useDiscovery, useSelector } from 'src/hooks/suite';

import { EarnTotalBalance } from './EarnTotalBalance';

type EarnBalanceCardWrapperProps = {
    children?: ReactNode;
};

const EarnBalanceCardWrapper = ({ children }: EarnBalanceCardWrapperProps) => (
    <Card>
        <Column alignItems="flex-start" gap={8}>
            <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                <Translation id="TR_EARN_EARNING_BALANCE" />
            </Text>

            {children}
        </Column>
    </Card>
);

export const EarnBalanceCard = () => {
    const { isDiscoveryRunning } = useDiscovery();
    const { yieldOpportunities } = useYieldOpportunities();
    const { isFiatRatesLoading } = useEarnMissingRateTickersQuery();

    const totalEarnFiatAmount = useSelector(state =>
        selectEarnTotalFiatAmount(state, yieldOpportunities),
    );

    const isFiatTotalIncomplete = useSelector(state =>
        selectIsEarnFiatTotalIncomplete(state, yieldOpportunities, isFiatRatesLoading),
    );

    const isFiatTotalUnavailable = useSelector(state =>
        selectIsEarnFiatTotalUnavailable(state, yieldOpportunities, isFiatRatesLoading),
    );

    const isLoading = isDiscoveryRunning || isFiatRatesLoading;

    if (isLoading) {
        return (
            <EarnBalanceCardWrapper>
                <Skeleton width={180} height={56} />
            </EarnBalanceCardWrapper>
        );
    }

    const fiatValue = isFiatTotalUnavailable ? undefined : new BigNumber(totalEarnFiatAmount);

    return (
        <EarnBalanceCardWrapper>
            <Column width="100%" gap={16}>
                <EarnTotalBalance fiatValue={fiatValue} isIncomplete={isFiatTotalIncomplete} />
            </Column>
        </EarnBalanceCardWrapper>
    );
};
