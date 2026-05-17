import React from 'react';

import { Translation } from '@suite/intl';
import { getDaysToAddToPoolInitial } from '@suite-common/staking';
import { EarnFlow } from '@suite-common/suite-types/src/staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { CARDANO_ACTIVATION_PERIOD_DAYS, CARDANO_EPOCH_DAYS } from '@suite-common/wallet-constants';
import { selectEthValidatorsQueue, selectPoolStatsApy } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { SOLANA_EPOCH_DAYS } from '@trezor/coins-solana/constants';
import { BulletList } from '@trezor/components';

import { formatApyValue } from 'src/components/earn/utils/earnApyUtils';
import { useSelector } from 'src/hooks/suite';

import { EarnInfoRow } from './EarnInfoRow';

interface EarnSupplyingInfoProps {
    account: Account;
    flow: EarnFlow;
}

interface EarnSupplyingRowsProps {
    flow: EarnFlow;
    displaySymbol: string;
    apy: number | null;
    daysToAddToPool?: number;
}

const SupplyingSignRow = ({ flow }: Pick<EarnSupplyingRowsProps, 'flow'>) => (
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

const EthereumSupplyingRows = ({
    flow,
    displaySymbol,
    apy,
    daysToAddToPool,
}: EarnSupplyingRowsProps) => (
    <>
        <SupplyingSignRow flow={flow} />
        <EarnInfoRow
            heading={<Translation id="TR_EARN_ENTER_THE_STAKING_POOL" />}
            subheading={
                <Translation
                    id="TR_EARN_STAKING_GETTING_READY"
                    values={{ networkDisplaySymbol: displaySymbol }}
                />
            }
            content={{
                text: (
                    <Translation
                        id="TR_EARN_APPROXIMATE_DAYS"
                        values={{ count: daysToAddToPool }}
                    />
                ),
            }}
        />
        <EarnInfoRow
            heading={<Translation id="TR_EARN_REWARDS_WEEKLY" />}
            subheading={<Translation id="TR_EARN_REWARDS_ARE_RESTAKED" />}
            content={{
                text: (
                    <Translation
                        id="TR_EARN_APY_APPROX"
                        values={{ apyPercent: formatApyValue(apy) }}
                    />
                ),
            }}
        />
    </>
);

const SolanaSupplyingRows = ({ flow, displaySymbol, apy }: EarnSupplyingRowsProps) => (
    <>
        <SupplyingSignRow flow={flow} />
        <EarnInfoRow
            heading={<Translation id="TR_EARN_WARM_UP_PERIOD" />}
            subheading={
                <Translation
                    id="TR_EARN_STAKE_WAIT_FOR_ACTIVATION"
                    values={{ networkDisplaySymbol: displaySymbol }}
                />
            }
            content={{
                text: <Translation id="TR_UP_TO_DAYS" values={{ count: SOLANA_EPOCH_DAYS }} />,
            }}
        />
        <EarnInfoRow
            heading={
                <Translation id="TR_EARN_REWARDS_EVERY" values={{ days: SOLANA_EPOCH_DAYS }} />
            }
            subheading={<Translation id="TR_EARN_REWARDS_ARE_RESTAKED" />}
            content={{
                text: (
                    <Translation
                        id="TR_EARN_APY_APPROX"
                        values={{ apyPercent: formatApyValue(apy) }}
                    />
                ),
            }}
        />
    </>
);

const CardanoSupplyingRows = ({ flow, apy }: EarnSupplyingRowsProps) => (
    <>
        <SupplyingSignRow flow={flow} />
        <EarnInfoRow
            heading={
                <Translation
                    id={
                        flow === EarnFlow.UpdateProvider
                            ? 'TR_EARN_KEEP_EARNING_REWARDS_WITH_CURRENT_PROVIDER'
                            : 'TR_EARN_ENTER_ACTIVATION_PERIOD'
                    }
                    values={{ days: CARDANO_ACTIVATION_PERIOD_DAYS }}
                />
            }
            subheading={<Translation id="TR_EARN_TIME_TO_START_EARNING" />}
            content={{
                text: (
                    <Translation
                        id="TR_EARN_APPROXIMATE_DAYS"
                        values={{ count: CARDANO_ACTIVATION_PERIOD_DAYS }}
                    />
                ),
            }}
        />
        <EarnInfoRow
            heading={
                <Translation
                    id={
                        flow === EarnFlow.UpdateProvider
                            ? 'TR_EARN_START_EARNING_FROM_NEW_PROVIDER'
                            : 'TR_EARN_REWARDS_EVERY'
                    }
                    values={{ days: CARDANO_EPOCH_DAYS }}
                />
            }
            subheading={<Translation id="TR_EARN_REWARDS_ARE_RESTAKED" />}
            content={{
                text: (
                    <Translation
                        id="TR_EARN_APY_APPROX"
                        values={{ apyPercent: formatApyValue(apy) }}
                    />
                ),
            }}
        />
    </>
);

export const EarnSupplyingInfo = ({ account, flow }: EarnSupplyingInfoProps) => {
    const validatorsQueue = useSelector(selectEthValidatorsQueue);

    const apy = useSelector(state => selectPoolStatsApy(state, { account }));

    const daysToAddToPoolInitial = getDaysToAddToPoolInitial(validatorsQueue);
    const displaySymbol = getNetworkDisplaySymbol(account.symbol);

    const content = (() => {
        switch (account.networkType) {
            case 'ethereum':
                return (
                    <EthereumSupplyingRows
                        flow={flow}
                        displaySymbol={displaySymbol}
                        apy={apy}
                        daysToAddToPool={daysToAddToPoolInitial}
                    />
                );
            case 'solana':
                return <SolanaSupplyingRows flow={flow} displaySymbol={displaySymbol} apy={apy} />;
            case 'cardano':
                return <CardanoSupplyingRows flow={flow} displaySymbol={displaySymbol} apy={apy} />;
            default:
                return null;
        }
    })();

    if (!content) return null;

    return (
        <BulletList bulletGap={12} gap={16} bulletSize="small" titleGap={2}>
            {content}
        </BulletList>
    );
};
