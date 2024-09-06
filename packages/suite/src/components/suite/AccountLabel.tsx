import styled from 'styled-components';
import { getTitleForNetwork, getTitleForCoinjoinAccount } from '@suite-common/wallet-utils';
import { BadgeSize, Row, TOOLTIP_DELAY_LONG, TruncateWithTooltip } from '@trezor/components';
import { useCallback } from 'react';
import { useTranslation } from '../../hooks/suite';
import { spacings } from '@trezor/theme';
import { AccountType, NetworkSymbol } from '@suite-common/wallet-config';
import { AccountTypeBadge } from './AccountTypeBadge';
import { Bip43Path, NetworkType } from '@suite-common/wallet-config';

const TabularNums = styled.span`
    font-variant-numeric: tabular-nums;
    text-overflow: ellipsis;
    overflow: hidden;
`;

export interface AccountLabelProps {
    accountLabel?: string;
    accountType: AccountType;
    symbol: NetworkSymbol;
    index?: number;
    showAccountTypeBadge?: boolean;
    accountTypeBadgeSize?: BadgeSize;
    path?: Bip43Path;
    networkType?: NetworkType;
}

export const useAccountLabel = () => {
    const { translationString } = useTranslation();

    const defaultAccountLabelString = useCallback(
        ({
            accountType,
            symbol,
            index = 0,
        }: {
            accountType: AccountType;
            symbol: NetworkSymbol;
            index?: number;
        }) => {
            if (accountType === 'coinjoin') {
                return translationString(getTitleForCoinjoinAccount(symbol));
            }

            return translationString('LABELING_ACCOUNT', {
                networkName: translationString(getTitleForNetwork(symbol)), // Bitcoin, Ethereum, ...
                index: index + 1, // This is the number which shows after hash, e.g. Ethereum #3
            });
        },
        [translationString],
    );

    return {
        defaultAccountLabelString,
    };
};

export const AccountLabel = ({
    accountLabel,
    accountType = 'normal',
    path,
    networkType,
    showAccountTypeBadge,
    accountTypeBadgeSize = 'medium',
    symbol,
    index = 0,
}: AccountLabelProps) => {
    const { defaultAccountLabelString } = useAccountLabel();

    if (accountLabel) {
        return (
            <TruncateWithTooltip delayShow={TOOLTIP_DELAY_LONG}>
                <Row gap={spacings.sm}>
                    <TabularNums>{accountLabel}</TabularNums>
                    {showAccountTypeBadge && (
                        <AccountTypeBadge
                            accountType={accountType}
                            size={accountTypeBadgeSize}
                            path={path}
                            networkType={networkType}
                        />
                    )}
                </Row>
            </TruncateWithTooltip>
        );
    }

    return (
        <TruncateWithTooltip delayShow={TOOLTIP_DELAY_LONG}>
            <Row gap={spacings.sm}>
                {defaultAccountLabelString({ accountType, symbol, index })}
                {showAccountTypeBadge && (
                    <AccountTypeBadge
                        accountType={accountType}
                        size={accountTypeBadgeSize}
                        path={path}
                        networkType={networkType}
                    />
                )}
            </Row>
        </TruncateWithTooltip>
    );
};
