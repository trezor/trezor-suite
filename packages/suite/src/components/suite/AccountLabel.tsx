import styled from 'styled-components';
import { getTitleForNetwork, getTitleForCoinjoinAccount } from '@suite-common/wallet-utils';
import { Account } from 'src/types/wallet';
import { TruncateWithTooltip } from '@trezor/components';
import { useCallback } from 'react';
import { useTranslation } from '../../hooks/suite';

const TabularNums = styled.span`
    font-variant-numeric: tabular-nums;
    text-overflow: ellipsis;
    overflow: hidden;
`;

export interface AccountLabelProps {
    accountLabel?: string;
    accountType: Account['accountType'];
    symbol: Account['symbol'];
    index?: number;
}

export const useAccountLabel = () => {
    const { translationString } = useTranslation();

    const defaultAccountLabelString = useCallback(
        ({
            accountType,
            symbol,
            index = 0,
        }: {
            accountType: Account['accountType'];
            symbol: Account['symbol'];
            index?: number;
        }) => {
            if (accountType === 'coinjoin') {
                return translationString(getTitleForCoinjoinAccount(symbol));
            }

            return translationString('LABELING_ACCOUNT', {
                networkName: translationString(getTitleForNetwork(symbol)), // Bitcoin, Ethereum, ...
                index: index + 1, // this is the number which shows after hash, e.g. Ethereum #3
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
    accountType,
    symbol,
    index = 0,
}: AccountLabelProps) => {
    const { defaultAccountLabelString } = useAccountLabel();

    if (accountLabel) {
        return (
            <TruncateWithTooltip delay={1000}>
                <TabularNums>{accountLabel}</TabularNums>
            </TruncateWithTooltip>
        );
    }

    return (
        <TruncateWithTooltip delay={1000}>
            {defaultAccountLabelString({ accountType, symbol, index })}
        </TruncateWithTooltip>
    );
};
