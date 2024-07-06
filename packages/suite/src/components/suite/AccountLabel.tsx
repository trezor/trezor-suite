import styled from 'styled-components';
import { getTitleForNetwork, getTitleForCoinjoinAccount } from '@suite-common/wallet-utils';
import { Account } from 'src/types/wallet';
import { useCallback } from 'react';
import { useTranslation } from '../../hooks/suite';

const MAX_LABEL_LENGTH = 10;

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
                networkName: translationString(getTitleForNetwork(symbol)),
                index: index + 1,
            });
        },
        [translationString],
    );

    return {
        defaultAccountLabelString,
    };
};

const truncateLabel = (label: string | undefined, maxLength: number): string => {
    if (!label) return '';
    if (label.length <= maxLength) return label;
    return `${label.substring(0, maxLength - 3)}...`;
};

export const AccountLabel = ({
    accountLabel,
    accountType,
    symbol,
    index = 0,
}: AccountLabelProps) => {
    const { defaultAccountLabelString } = useAccountLabel();

    const accountLabelSafe = accountLabel || ''; // Default to an empty string if undefined
    const label = accountLabelSafe
        ? truncateLabel(accountLabelSafe, MAX_LABEL_LENGTH)
        : defaultAccountLabelString({ accountType, symbol, index });

    return <TabularNums>{label}</TabularNums>;
};