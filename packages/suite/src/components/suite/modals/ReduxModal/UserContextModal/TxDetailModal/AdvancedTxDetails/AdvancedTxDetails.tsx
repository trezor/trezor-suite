import { useState } from 'react';
import styled from 'styled-components';
import { Translation } from 'src/components/suite';
import { variables } from '@trezor/components';
import { isTestnet } from '@suite-common/wallet-utils';
import { WalletAccountTransaction, ChainedTransactions } from '@suite-common/wallet-types';
import { Network } from 'src/types/wallet';
import { AmountDetails } from './AmountDetails';
import { IODetails } from './IODetails/IODetails';
import { ChainedTxs } from '../ChainedTxs';

const Wrapper = styled.div`
    padding: 0 24px 10px;

    ${variables.SCREEN_QUERY.MOBILE} {
        padding-left: 10px;
        padding-right: 10px;
    }
`;

const TabSelector = styled.div`
    width: 100%;
    text-align: left;
    margin-bottom: 16px;
    border-bottom: 1px solid ${({ theme }) => theme.STROKE_GREY};
`;

const TabButton = styled.button<{ selected: boolean }>`
    border: none;
    background-color: inherit;
    font-size: ${variables.NEUE_FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    padding-top: 12px;
    padding-bottom: 12px;
    margin-right: 40px;
    cursor: pointer;

    /* change styles if the button is selected */
    color: ${({ selected, theme }) =>
        selected ? `${theme.TYPE_GREEN}` : `${theme.TYPE_LIGHT_GREY}`};
    border-bottom: ${({ selected, theme }) => (selected ? `2px solid ${theme.BG_GREEN}` : 'none')};

    :hover {
        border-bottom: 2px solid ${({ theme, selected }) => !selected && theme.STROKE_GREY};
    }
`;

export type TabID = 'amount' | 'io' | 'chained';

interface AdvancedTxDetailsProps {
    defaultTab?: TabID;
    network: Network;
    tx: WalletAccountTransaction;
    chainedTxs?: ChainedTransactions;
    explorerUrl: string;
}

export const AdvancedTxDetails = ({
    defaultTab,
    network,
    tx,
    chainedTxs,
    explorerUrl,
}: AdvancedTxDetailsProps) => {
    const [selectedTab, setSelectedTab] = useState<TabID>(defaultTab ?? 'amount');

    let content: JSX.Element | undefined;

    if (selectedTab === 'amount') {
        content = <AmountDetails tx={tx} isTestnet={isTestnet(network.symbol)} />;
    } else if (selectedTab === 'io' && network.networkType !== 'ripple') {
        content = <IODetails tx={tx} />;
    } else if (selectedTab === 'chained' && chainedTxs) {
        content = <ChainedTxs txs={chainedTxs} explorerUrl={explorerUrl} network={network} />;
    }

    return (
        <Wrapper>
            <TabSelector>
                <TabButton
                    selected={selectedTab === 'amount'}
                    onClick={() => setSelectedTab('amount')}
                >
                    <Translation id="TR_TX_TAB_AMOUNT" />
                </TabButton>

                {network.networkType !== 'ripple' && (
                    <TabButton selected={selectedTab === 'io'} onClick={() => setSelectedTab('io')}>
                        <Translation id="TR_INPUTS_OUTPUTS" />
                    </TabButton>
                )}

                {chainedTxs && (
                    <TabButton
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
