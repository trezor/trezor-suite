import { TotalBalanceCard, TotalBalanceHeadline } from '@suite/assets';
import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import {
    selectEarnTotalFiatAmount,
    selectIsEarnFiatTotalIncomplete,
    selectIsEarnFiatTotalUnavailable,
    useEarnMissingRateTickersQuery,
} from '@suite-common/earn';
import { useYieldOpportunities } from '@suite-common/wallet-core';
import { Button, Text } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { CaretRightIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

import { useDiscovery } from '#src/hooks/suite/useDiscovery';
import { useSelector } from '#src/hooks/suite/useSelector';

type EarnBalanceCardProps = {
    positionsCount: number;
};

export const EarnBalanceCard = ({ positionsCount }: EarnBalanceCardProps) => {
    const { dispatch } = useServices(injectDispatch);
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

    const onMyPositionsClick = () => dispatch(gotoThunk({ routeName: 'earn-positions' }));

    const isLoading = isDiscoveryRunning || isFiatRatesLoading;
    const fiatValue = isFiatTotalUnavailable ? undefined : new BigNumber(totalEarnFiatAmount);

    const actions = (
        <Button intent="neutral" iconRight={CaretRightIcon} onClick={onMyPositionsClick}>
            <Translation id="TR_EARN_MY_POSITIONS" />
        </Button>
    );

    return (
        <TotalBalanceCard
            label={<Translation id="TR_EARN_EARNING_BALANCE" />}
            isLoading={isLoading}
            actions={actions}
        >
            <TotalBalanceHeadline
                fiatValue={fiatValue}
                isApproximate={isFiatTotalIncomplete}
                fallback={<Translation id="TR_EARN_N_A" />}
                data-testid="@earn/dashboard/total-balance"
            />
            <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                <Translation id="TR_EARN_ACTIVE_POSITIONS" values={{ count: positionsCount }} />
            </Text>
        </TotalBalanceCard>
    );
};
