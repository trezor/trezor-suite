import React from 'react';

import { Translation } from '@suite/intl';
import { EarnFlow } from '@suite-common/suite-types/src/staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { getUnstakingPeriodInDays, selectEthereumValidatorsQueue } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { StepList } from '@trezor/components';
import { SOLANA_EPOCH_DAYS } from '@trezor/network-solana/constants';

import { useSelector } from 'src/hooks/suite';

import { EarnInfoRow } from './EarnInfoRow';

interface EarnWithdrawingInfoProps {
    account: Account;
    flow: EarnFlow;
}

interface EarnWithdrawingRowsProps {
    flow: EarnFlow;
    displaySymbol: string;
    daysToUnstake?: number;
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
    daysToUnstake,
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
            content={{
                text: (
                    <Translation id="TR_EARN_APPROXIMATE_DAYS" values={{ count: daysToUnstake }} />
                ),
            }}
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

const SolanaWithdrawingRows = ({ flow, displaySymbol }: EarnWithdrawingRowsProps) => (
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
            content={{
                text: <Translation id="TR_UP_TO_DAYS" values={{ count: SOLANA_EPOCH_DAYS }} />,
            }}
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
    const validatorsQueue = useSelector(selectEthereumValidatorsQueue);
    const daysToUnstake = getUnstakingPeriodInDays(account.networkType, validatorsQueue);

    const displaySymbol = getNetworkDisplaySymbol(account.symbol);

    const content = (() => {
        switch (account.networkType) {
            case 'ethereum':
                return (
                    <EthereumWithdrawingRows
                        flow={flow}
                        displaySymbol={displaySymbol}
                        daysToUnstake={daysToUnstake}
                    />
                );
            case 'solana':
                return <SolanaWithdrawingRows flow={flow} displaySymbol={displaySymbol} />;
            case 'cardano':
                return <CardanoWithdrawingRows flow={flow} displaySymbol={displaySymbol} />;
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
