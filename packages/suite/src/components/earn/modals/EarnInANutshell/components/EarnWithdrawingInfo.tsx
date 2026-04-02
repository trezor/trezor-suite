import React from 'react';

import { Translation } from '@suite/intl';
import { EarnFlow } from '@suite-common/suite-types/src/staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { SOLANA_EPOCH_DAYS } from '@suite-common/wallet-constants';
import { selectEthValidatorsQueue } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getUnstakingPeriodInDays } from '@suite-common/wallet-utils';
import { BulletList } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

import { EarnInfoRow } from './EarnInfoRow';

interface EarnWithdrawingInfoProps {
    account: Account;
    isExpanded?: boolean;
    flow: EarnFlow;
}

interface EarnWithdrawingRowsProps {
    flow: EarnFlow;
    displaySymbol: string;
    isExpanded?: boolean;
    daysToUnstake?: number;
}

const WithdrawingSignRow = ({
    flow,
    isExpanded,
}: Pick<EarnWithdrawingRowsProps, 'flow' | 'isExpanded'>) => (
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
        isExpanded={isExpanded}
    />
);

const EthereumWithdrawingRows = ({
    flow,
    displaySymbol,
    isExpanded,
    daysToUnstake,
}: EarnWithdrawingRowsProps) => (
    <>
        <WithdrawingSignRow flow={flow} isExpanded={isExpanded} />
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
            isExpanded={isExpanded}
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
            isExpanded={isExpanded}
        />
        <EarnInfoRow
            heading={
                <Translation
                    id="TR_EARN_RECEIVE_IN_ACCOUNT"
                    values={{ networkDisplaySymbol: displaySymbol }}
                />
            }
            isExpanded={isExpanded}
        />
    </>
);

const SolanaWithdrawingRows = ({ flow, displaySymbol, isExpanded }: EarnWithdrawingRowsProps) => (
    <>
        <WithdrawingSignRow flow={flow} isExpanded={isExpanded} />
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
            isExpanded={isExpanded}
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
            isExpanded={isExpanded}
        />
        <EarnInfoRow
            heading={
                <Translation
                    id="TR_EARN_RECEIVE_IN_ACCOUNT"
                    values={{ networkDisplaySymbol: displaySymbol }}
                />
            }
            isExpanded={isExpanded}
        />
    </>
);

const CardanoWithdrawingRows = ({ flow, displaySymbol, isExpanded }: EarnWithdrawingRowsProps) => (
    <>
        <WithdrawingSignRow flow={flow} isExpanded={isExpanded} />
        <EarnInfoRow
            heading={<Translation id="TR_EARN_RECEIVE_DEPOSIT_IN_ACCOUNT" />}
            subheading={
                <Translation
                    id="TR_EARN_YOUR_DEPOSIT_IS_RETURNED"
                    values={{ networkDisplaySymbol: displaySymbol }}
                />
            }
            content={{ text: <Translation id="TR_EARN_INSTANTLY" /> }}
            isExpanded={isExpanded}
        />
    </>
);

export const EarnWithdrawingInfo = ({ account, isExpanded, flow }: EarnWithdrawingInfoProps) => {
    const validatorsQueue = useSelector(selectEthValidatorsQueue);
    const daysToUnstake = getUnstakingPeriodInDays(account.networkType, validatorsQueue);

    const displaySymbol = getNetworkDisplaySymbol(account.symbol);

    const content = (() => {
        switch (account.networkType) {
            case 'ethereum':
                return (
                    <EthereumWithdrawingRows
                        flow={flow}
                        displaySymbol={displaySymbol}
                        isExpanded={isExpanded}
                        daysToUnstake={daysToUnstake}
                    />
                );
            case 'solana':
                return (
                    <SolanaWithdrawingRows
                        flow={flow}
                        displaySymbol={displaySymbol}
                        isExpanded={isExpanded}
                    />
                );
            case 'cardano':
                return (
                    <CardanoWithdrawingRows
                        flow={flow}
                        displaySymbol={displaySymbol}
                        isExpanded={isExpanded}
                    />
                );
            default:
                return null;
        }
    })();

    if (!content) return null;

    return (
        <BulletList bulletGap={12} gap={16} bulletSize="small" titleGap={4}>
            {content}
        </BulletList>
    );
};
