import React, { JSX } from 'react';

import { Translation } from '@suite/intl';
import { NetworkSymbol, NetworkType, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { SOLANA_EPOCH_DAYS } from '@suite-common/wallet-constants';
import { selectValidatorsQueue } from '@suite-common/wallet-core';
import { getUnstakingPeriodInDays, isStakingNetworkType } from '@suite-common/wallet-utils';
import { BulletList } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { exhaustive } from '@trezor/type-utils';

import { useSelector } from 'src/hooks/suite';
import { CoinjoinRootState } from 'src/reducers/wallet/coinjoinReducer';

import { InfoRow } from './InfoRow';

type InfoRowsData = {
    readyForClaimDays: JSX.Element;
    deactivatePeriodHeading: JSX.Element;
    deactivatePeriodSubheading: JSX.Element;
};

const getInfoRowsData = (
    networkType: NetworkType,
    accountSymbol: NetworkSymbol,
    daysToUnstake?: number,
): InfoRowsData | null => {
    if (!isStakingNetworkType(networkType)) return null;

    switch (networkType) {
        case 'ethereum':
            return {
                readyForClaimDays: (
                    <Translation id="TR_STAKE_APPROXIMATE_DAYS" values={{ count: daysToUnstake }} />
                ),
                deactivatePeriodHeading: <Translation id="TR_STAKE_LEAVE_STAKING_POOL" />,
                deactivatePeriodSubheading: (
                    <Translation
                        id="TR_STAKING_CONSOLIDATING_FUNDS"
                        values={{ networkDisplaySymbol: getNetworkDisplaySymbol(accountSymbol) }}
                    />
                ),
            };
        case 'solana':
            return {
                readyForClaimDays: (
                    <Translation id="TR_UP_TO_DAYS" values={{ count: SOLANA_EPOCH_DAYS }} />
                ),
                deactivatePeriodHeading: <Translation id="TR_STAKE_COOL_DOWN_PERIOD" />,
                deactivatePeriodSubheading: (
                    <Translation
                        id="TR_STAKE_WAIT_FOR_DEACTIVATION"
                        values={{ networkDisplaySymbol: getNetworkDisplaySymbol(accountSymbol) }}
                    />
                ),
            };
        case 'cardano':
            return {
                readyForClaimDays: <Translation id="TR_STAKE_INSTANTLY" />,
                deactivatePeriodHeading: <Translation id="TR_STAKE_RECEIVE_DEPOSIT_IN_ACCOUNT" />,
                deactivatePeriodSubheading: (
                    <Translation
                        id="TR_STAKE_YOUR_DEPOSIT_IS_RETURNED"
                        values={{ networkDisplaySymbol: getNetworkDisplaySymbol(accountSymbol) }}
                    />
                ),
            };
        default:
            return exhaustive(networkType);
    }
};

interface UnstakingInfoProps {
    isExpanded?: boolean;
}

export const UnstakingInfo = ({ isExpanded }: UnstakingInfoProps) => {
    const { account } = useSelector((state: CoinjoinRootState) => state.wallet.selectedAccount);

    const { data } = useSelector(state => selectValidatorsQueue(state, account?.symbol)) || {};

    if (!account) return null;

    const isCardano = account.networkType === 'cardano';

    const daysToUnstake = getUnstakingPeriodInDays({
        networkType: account.networkType,
        validatorWithdrawTime: data?.validatorWithdrawTime,
        validatorExitTime: data?.validatorExitTime,
    });

    const displaySymbol = getNetworkDisplaySymbol(account.symbol);
    const infoRowsData = getInfoRowsData(account.networkType, account.symbol, daysToUnstake);

    const infoRows = [
        {
            heading: <Translation id="TR_STAKE_SIGN_UNSTAKING_TRANSACTION" />,
            content: {
                text: <Translation id="TR_TRADING_NETWORK_FEE" />,
                isBadge: true,
            },
        },
        {
            heading: infoRowsData?.deactivatePeriodHeading,
            subheading: infoRowsData?.deactivatePeriodSubheading,
            content: {
                text: infoRowsData?.readyForClaimDays,
            },
        },
        {
            heading: (
                <Translation
                    id="TR_STAKE_CLAIM_UNSTAKED"
                    values={{ networkDisplaySymbol: displaySymbol }}
                />
            ),
            subheading: (
                <Translation
                    id="TR_STAKING_YOUR_UNSTAKED_FUNDS"
                    values={{ networkDisplaySymbol: displaySymbol }}
                />
            ),
            content: {
                text: <Translation id="TR_TRADING_NETWORK_FEE" />,
                isBadge: true,
            },
            isHidden: isCardano,
        },
        {
            heading: (
                <Translation
                    id="TR_STAKE_IN_ACCOUNT"
                    values={{ networkDisplaySymbol: displaySymbol }}
                />
            ),
            isHidden: isCardano,
        },
    ];

    const visibleInfoRows = infoRows.filter(row => !row.isHidden);

    return (
        <BulletList
            bulletGap={spacings.sm}
            gap={spacings.md}
            bulletSize="small"
            titleGap={spacings.xxs}
        >
            {visibleInfoRows.map(({ heading, content, subheading }, index) => (
                <InfoRow key={index} {...{ heading, subheading, content, isExpanded }} />
            ))}
        </BulletList>
    );
};
