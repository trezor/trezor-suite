import { useState } from 'react';
import styled from 'styled-components';
import { Translation } from 'src/components/suite';
import { useElevation, variables } from '@trezor/components';
import { isTestnet } from '@suite-common/wallet-utils';
import { WalletAccountTransaction, ChainedTransactions } from '@suite-common/wallet-types';
import { Network } from 'src/types/wallet';
import { AmountDetails } from './AmountDetails';
import { IODetails } from './IODetails/IODetails';
import { ChainedTxs } from '../ChainedTxs';
import { Elevation, mapElevationToBorder, spacingsPx } from '@trezor/theme';

const Wrapper = styled.div`
    padding: 0 ${spacingsPx.xl} ${spacingsPx.sm};

    ${variables.SCREEN_QUERY.MOBILE} {
        padding-left: ${spacingsPx.sm};
        padding-right: ${spacingsPx.sm};
    }
`;

const TabSelector = styled.div<{ elevation: Elevation }>`
    width: 100%;
    text-align: left;
    margin-bottom: ${spacingsPx.md};
    border-bottom: 1px solid ${mapElevationToBorder};
`;

const TabButton = styled.button<{ selected: boolean; elevation: Elevation }>`
    border: none;
    background-color: inherit;
    padding-top: ${spacingsPx.sm};
    padding-bottom: ${spacingsPx.sm};
    margin-right: ${spacingsPx.xxxl};
    cursor: pointer;

    /* change styles if the button is selected */
    color: ${({ selected, theme }) =>
        selected ? `${theme.textPrimaryDefault}` : `${theme.textSubdued}`};
    border-bottom: ${({ selected, theme }) =>
        selected ? `2px solid ${theme.borderSecondary}` : 'none'};

    :hover {
        border-bottom: 2px solid
            ${({ selected, ...props }) => !selected && mapElevationToBorder(props)};
    }
`;

export type TabID = 'amount' | 'io' | 'chained';

interface AdvancedTxDetailsProps {
    defaultTab?: TabID;
    network: Network;
    tx: WalletAccountTransaction;
    chainedTxs?: ChainedTransactions;
    explorerUrl: string;
    isPhishingTransaction: boolean;
}

export const AdvancedTxDetails = ({
    defaultTab,
    network,
    tx,
    chainedTxs,
    explorerUrl,
    isPhishingTransaction,
}: AdvancedTxDetailsProps) => {
    const [selectedTab, setSelectedTab] = useState<TabID>(defaultTab ?? 'amount');

    let content: JSX.Element | undefined;

    if (selectedTab === 'amount') {
        content = <AmountDetails tx={tx} isTestnet={isTestnet(network.symbol)} />;
    } else if (selectedTab === 'io' && network.networkType !== 'ripple') {
        content = <IODetails tx={tx} isPhishingTransaction={isPhishingTransaction} />;
    } else if (selectedTab === 'chained' && chainedTxs) {
        content = <ChainedTxs txs={chainedTxs} explorerUrl={explorerUrl} network={network} />;
    }
    const { elevation } = useElevation();
    return (
        <Wrapper>
            <TabSelector elevation={elevation}>
                <TabButton
                    elevation={elevation}
                    selected={selectedTab === 'amount'}
                    onClick={() => setSelectedTab('amount')}
                >
                    <Translation id="TR_TX_TAB_AMOUNT" />
                </TabButton>

                {network.networkType !== 'ripple' && (
                    <TabButton
                        elevation={elevation}
                        selected={selectedTab === 'io'}
                        onClick={() => setSelectedTab('io')}
                    >
                        <Translation id="TR_INPUTS_OUTPUTS" />
                    </TabButton>
                )}

                {chainedTxs && (
                    <TabButton
                        elevation={elevation}
                        selected={selectedTab === 'chained'}
                        onClick={() => setSelectedTab('chained')}
                    >
                        <Translation id="TR_CHAINED_TXS" />
                    </TabButton>
                )}
            </TabSelector>

            {content}
        </Wrapper>
    );
};
