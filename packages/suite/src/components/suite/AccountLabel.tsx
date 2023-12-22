import styled from 'styled-components';
import { getTitleForNetwork, getTitleForCoinjoinAccount } from '@suite-common/wallet-utils';
import { Translation } from 'src/components/suite';
import { Account } from 'src/types/wallet';
import { TruncateWithTooltip } from '@trezor/components';

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

export const AccountLabel = ({
    accountLabel,
    accountType,
    symbol,
    index = 0,
}: AccountLabelProps) => {
    if (accountLabel) {
        return (
            <TruncateWithTooltip>
                <TabularNums>{accountLabel}</TabularNums>
            </TruncateWithTooltip>
        );
    }

    if (accountType === 'coinjoin') {
        return (
            <TruncateWithTooltip>
                <Translation id={getTitleForCoinjoinAccount(symbol)} />
            </TruncateWithTooltip>
        );
    }

    return (
        <TruncateWithTooltip>
            <Translation
                id="LABELING_ACCOUNT"
                isNested
                values={{
                    networkName: <Translation id={getTitleForNetwork(symbol)} />, // Bitcoin, Ethereum, ...
                    index: index + 1, // this is the number which shows after hash, e.g. Ethereum #3
                }}
            />
        </TruncateWithTooltip>
    );
};
