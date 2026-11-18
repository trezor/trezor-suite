import React from 'react';

import { Translation } from '@suite/intl';
import { useNetworkStakingPeriods } from '@suite-common/earn-staking';
import { EarnFlow } from '@suite-common/suite-types/src/staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { StepList } from '@trezor/components';

import { EarnInfoRow, getEarnInfoRowDaysContent } from './EarnInfoRow';

interface EarnWithdrawingInfoProps {
    account: Account;
    flow: EarnFlow;
}

interface EarnWithdrawingRowsProps {
    flow: EarnFlow;
    displaySymbol: string;
    exitPeriodDays: number | null;
}

const WithdrawingSignRow = ({ flow }: Pick<EarnWithdrawingRowsProps, 'flow'>) => (
    <EarnInfoRow
        heading={
            <Translation
                id={
                    flow === EarnFlow.Yield
                        ? 'TR_EARN_SIGN_WITHDRAWAL_TRANSACTION'
                        : 'TR_EARN_SIGN_UNSTAKING_TRANSACTION'
                }
            />
        }
        content={{ text: <Translation id="TR_TRADING_NETWORK_FEE" />, isBadge: true }}
    />
);

const EthereumWithdrawingRows = ({
    flow,
    displaySymbol,
    exitPeriodDays,
}: EarnWithdrawingRowsProps) => (
    <>
        <WithdrawingSignRow flow={flow} />
        <EarnInfoRow
            heading={<Translation id="TR_EARN_LEAVE_STAKING_POOL" />}
            subheading={
                <Translation
                    id="TR_EARN_STAKING_CONSOLIDATING_FUNDS"
                    values={{ networkDisplaySymbol: displaySymbol }}
                />
            }
            content={getEarnInfoRowDaysContent(exitPeriodDays, 'TR_EARN_APPROXIMATE_DAYS')}
        />
        <EarnInfoRow
            heading={
                <Translation
                    id="TR_EARN_CLAIM_UNSTAKED"
                    values={{ networkDisplaySymbol: displaySymbol }}
                />
            }
            subheading={
                <Translation
                    id="TR_EARN_YOUR_UNSTAKED_FUNDS"
                    values={{ networkDisplaySymbol: displaySymbol }}
                />
            }
            content={{ text: <Translation id="TR_TRADING_NETWORK_FEE" />, isBadge: true }}
        />
        <EarnInfoRow
            heading={
                <Translation
                    id="TR_EARN_RECEIVE_IN_ACCOUNT"
                    values={{ networkDisplaySymbol: displaySymbol }}
                />
            }
        />
    </>
);

const SolanaWithdrawingRows = ({
    flow,
    displaySymbol,
    exitPeriodDays,
}: EarnWithdrawingRowsProps) => (
    <>
        <WithdrawingSignRow flow={flow} />
        <EarnInfoRow
            heading={<Translation id="TR_EARN_COOL_DOWN_PERIOD" />}
            subheading={
                <Translation
                    id="TR_EARN_STAKING_WAIT_FOR_DEACTIVATION"
                    values={{ networkDisplaySymbol: displaySymbol }}
                />
            }
            content={getEarnInfoRowDaysContent(exitPeriodDays, 'TR_UP_TO_DAYS')}
        />
        <EarnInfoRow
            heading={
                <Translation
                    id="TR_EARN_CLAIM_UNSTAKED"
                    values={{ networkDisplaySymbol: displaySymbol }}
                />
            }
            subheading={
                <Translation
                    id="TR_EARN_YOUR_UNSTAKED_FUNDS"
                    values={{ networkDisplaySymbol: displaySymbol }}
                />
            }
            content={{ text: <Translation id="TR_TRADING_NETWORK_FEE" />, isBadge: true }}
        />
        <EarnInfoRow
            heading={
                <Translation
                    id="TR_EARN_RECEIVE_IN_ACCOUNT"
                    values={{ networkDisplaySymbol: displaySymbol }}
                />
            }
        />
    </>
);

const CardanoWithdrawingRows = ({ flow, displaySymbol }: EarnWithdrawingRowsProps) => (
    <>
        <WithdrawingSignRow flow={flow} />
        <EarnInfoRow
            heading={<Translation id="TR_EARN_RECEIVE_DEPOSIT_IN_ACCOUNT" />}
            subheading={
                <Translation
                    id="TR_EARN_YOUR_DEPOSIT_IS_RETURNED"
                    values={{ networkDisplaySymbol: displaySymbol }}
                />
            }
            content={{ text: <Translation id="TR_EARN_INSTANTLY" /> }}
        />
    </>
);

export const EarnWithdrawingInfo = ({ account, flow }: EarnWithdrawingInfoProps) => {
    const { exitPeriodDays } = useNetworkStakingPeriods(account.symbol);

    const displaySymbol = getNetworkDisplaySymbol(account.symbol);
    const rowsProps: EarnWithdrawingRowsProps = { flow, displaySymbol, exitPeriodDays };

    const content = (() => {
        switch (account.networkType) {
            case 'ethereum':
                return <EthereumWithdrawingRows {...rowsProps} />;
            case 'solana':
                return <SolanaWithdrawingRows {...rowsProps} />;
            case 'cardano':
                return <CardanoWithdrawingRows {...rowsProps} />;
            default:
                return null;
        }
    })();

    if (!content) return null;

    return (
        <StepList bulletGap={12} gap={16} bulletSize="small" titleGap={4}>
            {content}
        </StepList>
    );
};
