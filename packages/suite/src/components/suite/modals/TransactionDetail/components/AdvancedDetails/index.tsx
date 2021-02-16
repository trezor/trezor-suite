import React, { useState } from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { variables } from '@trezor/components';
import { isTestnet } from '@wallet-utils/accountUtils';
import { Network, WalletAccountTransaction } from '@wallet-types';
import AmountDetails from '../AmountDetails';
import IODetails from '../IODetails';
import ChainedTxs from '../ChainedTxs';

const Wrapper = styled.div`
    padding: 0px 24px;
`;

const TabSelector = styled.div`
    width: 100%;
    text-align: left;
    margin-bottom: 6px;
    border-bottom: 1px solid ${props => props.theme.STROKE_GREY};
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
    /* change styles if the button is selected*/
    color: ${props =>
        props.selected ? `${props.theme.TYPE_GREEN}` : `${props.theme.TYPE_LIGHT_GREY}`};
    border-bottom: ${props => (props.selected ? `2px solid ${props.theme.BG_GREEN}` : 'none')};
`;

export type TabID = 'amount' | 'io' | 'chained';

interface Props {
    defaultTab?: TabID;
    network: Network;
    tx: WalletAccountTransaction;
    chainedTxs: WalletAccountTransaction[];
}

const AdvancedDetails = ({ defaultTab, network, tx, chainedTxs }: Props) => {
    const [selectedTab, setSelectedTab] = useState<TabID>(defaultTab ?? 'amount');

    let content: JSX.Element | undefined;
    if (selectedTab === 'amount') {
        content = <AmountDetails tx={tx} isTestnet={isTestnet(network.symbol)} />;
    } else if (selectedTab === 'io' && network.networkType !== 'ripple') {
        content = <IODetails tx={tx} />;
    } else if (selectedTab === 'chained' && chainedTxs.length > 0) {
        content = <ChainedTxs txs={chainedTxs} />;
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
                {chainedTxs.length > 0 && (
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

export default AdvancedDetails;
