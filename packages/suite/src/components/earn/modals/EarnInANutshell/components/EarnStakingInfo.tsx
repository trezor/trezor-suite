import { AssetSymbol } from '@suite/assets';
import { Translation } from '@suite/intl';
import { useNetworkStakingPeriods, useNetworkStakingRate } from '@suite-common/earn-staking';
import { EarnFlow } from '@suite-common/suite-types/src/staking';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    CARDANO_ACTIVATION_PERIOD_MAX_DAYS,
    CARDANO_ACTIVATION_PERIOD_MIN_DAYS,
} from '@suite-common/wallet-constants';
import { type Account } from '@suite-common/wallet-types';
import { StepList } from '@trezor/components';

import { StakingRateTooltip } from '#src/components/earn/staking/StakingRateTooltip';
import { useFormatApy } from '#src/hooks/earn/useFormatApy';

import { EarnInfoRow, getEarnInfoRowDaysContent } from './EarnInfoRow';

interface EarnStakingInfoProps {
    account: Account;
    flow: EarnFlow;
}

interface EarnStakingRowsProps {
    flow: EarnFlow;
    networkSymbol: NetworkSymbol;
    apy: number | null;
    entryPeriodDays: number | null;
    rewardPeriodDays: number | null;
}

const StakingSignRow = ({ flow }: Pick<EarnStakingRowsProps, 'flow'>) => (
    <EarnInfoRow
        heading={
            <Translation
                id={
                    flow === EarnFlow.Yield
                        ? 'TR_EARN_SIGN_WITHDRAWAL_TRANSACTION'
                        : 'TR_EARN_SIGN_STAKING_TRANSACTION'
                }
            />
        }
        content={{ text: <Translation id="TR_TRADING_NETWORK_FEE" />, isBadge: true }}
    />
);

const ApproximateApy = ({
    apy,
    networkSymbol,
}: Pick<EarnStakingRowsProps, 'apy' | 'networkSymbol'>) => {
    const formatApyValue = useFormatApy();

    return apy === null ? (
        <Translation id="TR_EARN_APY_N_A" />
    ) : (
        <StakingRateTooltip networkSymbol={networkSymbol} rate={apy} rateKind="apy">
            <Translation id="TR_EARN_APY_APPROX" values={{ apyPercent: formatApyValue(apy) }} />
        </StakingRateTooltip>
    );
};

const RewardsEveryHeading = ({ days }: { days: number | null }) =>
    days === null ? (
        <Translation id="TR_EARN_REWARDS_EVERY_WITHOUT_DAYS" />
    ) : (
        <Translation id="TR_EARN_REWARDS_EVERY" values={{ days }} />
    );

const EthereumStakingRows = ({
    flow,
    networkSymbol,
    apy,
    entryPeriodDays,
}: EarnStakingRowsProps) => (
    <>
        <StakingSignRow flow={flow} />
        <EarnInfoRow
            heading={<Translation id="TR_EARN_ENTER_THE_STAKING_POOL" />}
            subheading={
                <Translation
                    id="TR_EARN_STAKING_GETTING_READY"
                    values={{ networkDisplaySymbol: <AssetSymbol networkSymbol={networkSymbol} /> }}
                />
            }
            content={getEarnInfoRowDaysContent(entryPeriodDays, 'TR_EARN_APPROXIMATE_DAYS')}
        />
        <EarnInfoRow
            heading={<Translation id="TR_EARN_REWARDS_WEEKLY" />}
            subheading={<Translation id="TR_EARN_REWARDS_ARE_RESTAKED" />}
            content={{ text: <ApproximateApy apy={apy} networkSymbol={networkSymbol} /> }}
        />
    </>
);

const SolanaStakingRows = ({
    flow,
    networkSymbol,
    apy,
    entryPeriodDays,
    rewardPeriodDays,
}: EarnStakingRowsProps) => (
    <>
        <StakingSignRow flow={flow} />
        <EarnInfoRow
            heading={<Translation id="TR_EARN_WARM_UP_PERIOD" />}
            subheading={
                <Translation
                    id="TR_EARN_STAKE_WAIT_FOR_ACTIVATION"
                    values={{ networkDisplaySymbol: <AssetSymbol networkSymbol={networkSymbol} /> }}
                />
            }
            content={getEarnInfoRowDaysContent(entryPeriodDays, 'TR_UP_TO_DAYS')}
        />
        <EarnInfoRow
            heading={<RewardsEveryHeading days={rewardPeriodDays} />}
            subheading={<Translation id="TR_EARN_REWARDS_ARE_RESTAKED" />}
            content={{ text: <ApproximateApy apy={apy} networkSymbol={networkSymbol} /> }}
        />
    </>
);

const CardanoStakingRows = ({
    flow,
    networkSymbol,
    apy,
    rewardPeriodDays,
}: EarnStakingRowsProps) => (
    <>
        <StakingSignRow flow={flow} />
        <EarnInfoRow
            heading={
                <Translation
                    id={
                        flow === EarnFlow.UpdateProvider
                            ? 'TR_EARN_KEEP_EARNING_REWARDS_WITH_CURRENT_PROVIDER'
                            : 'TR_EARN_ENTER_ACTIVATION_PERIOD'
                    }
                />
            }
            subheading={<Translation id="TR_EARN_TIME_TO_START_EARNING" />}
            content={{
                text: (
                    <Translation
                        id="TR_EARN_APPROXIMATE_DAYS_RANGE"
                        values={{
                            minDays: CARDANO_ACTIVATION_PERIOD_MIN_DAYS,
                            maxDays: CARDANO_ACTIVATION_PERIOD_MAX_DAYS,
                        }}
                    />
                ),
            }}
        />
        <EarnInfoRow
            heading={
                flow === EarnFlow.UpdateProvider ? (
                    <Translation id="TR_EARN_START_EARNING_FROM_NEW_PROVIDER" />
                ) : (
                    <RewardsEveryHeading days={rewardPeriodDays} />
                )
            }
            subheading={<Translation id="TR_EARN_REWARDS_ARE_RESTAKED" />}
            content={{ text: <ApproximateApy apy={apy} networkSymbol={networkSymbol} /> }}
        />
    </>
);

export const EarnStakingInfo = ({ account, flow }: EarnStakingInfoProps) => {
    const { rate: apy } = useNetworkStakingRate({ networkSymbol: account.symbol });
    const { entryPeriodDays, rewardPeriodDays } = useNetworkStakingPeriods(account.symbol);
    const rowsProps: EarnStakingRowsProps = {
        flow,
        networkSymbol: account.symbol,
        apy,
        entryPeriodDays,
        rewardPeriodDays,
    };

    const content = (() => {
        switch (account.networkType) {
            case 'ethereum':
                return <EthereumStakingRows {...rowsProps} />;
            case 'solana':
                return <SolanaStakingRows {...rowsProps} />;
            case 'cardano':
                return <CardanoStakingRows {...rowsProps} />;
            default:
                return null;
        }
    })();

    if (!content) return null;

    return (
        <StepList bulletGap={12} gap={16} bulletSize="small" titleGap={2}>
            {content}
        </StepList>
    );
};
