import React, { useState } from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { variables } from '@trezor/components';
import { isTestnet } from '@wallet-utils/accountUtils';
import { Network, WalletAccountTransaction } from '@wallet-types';
import AmountDetails from '../AmountDetails';
import IODetails from '../IODetails';

const Wrapper = styled.div`
    padding: 0px 24px 14px 24px;
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

interface Props {
    network: Network;
    tx: WalletAccountTransaction;
    txDetails: any; // TODO: from tx.details
    isFetching: boolean;
}

const AdvancedDetails = ({ network, tx, txDetails, isFetching }: Props) => {
    const [selectedTab, setSelectedTab] = useState<'amount' | 'io'>('amount');
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
            </TabSelector>
            {selectedTab === 'amount' ? (
                <AmountDetails
                    tx={tx}
                    txDetails={txDetails}
                    // isFetching={isFetching}
                    isTestnet={isTestnet(network.symbol)}
                />
            ) : (
                network.networkType !== 'ripple' && (
                    <IODetails tx={tx} txDetails={txDetails} isFetching={isFetching} />
                )
            )}
        </Wrapper>
    );
};

export default AdvancedDetails;
