import { useState } from 'react';

import styled from 'styled-components';

import { useElevation, Row, Divider, Card } from '@trezor/components';
import { isTestnet } from '@suite-common/wallet-utils';
import { WalletAccountTransaction, ChainedTransactions } from '@suite-common/wallet-types';
import { AccountType, Network } from '@suite-common/wallet-config';
import { Elevation, mapElevationToBorder, spacingsPx, spacings, borders } from '@trezor/theme';

import { Translation } from 'src/components/suite';

import { AmountDetails } from './AmountDetails';
import { IODetails } from './IODetails/IODetails';
import { ChainedTxs } from '../ChainedTxs';
import { Data } from './Data';

const TabButton = styled.button<{ $isSelected: boolean; $elevation: Elevation }>`
    border: none;
    background-color: inherit;
    padding-bottom: ${spacingsPx.sm};
    cursor: pointer;
    border-bottom: ${borders.widths.large} solid
        ${({ $isSelected, theme }) => ($isSelected ? theme.borderSecondary : 'transparent')};
    color: ${({ $isSelected, theme }) =>
        $isSelected ? theme.textPrimaryDefault : theme.textSubdued};

    &:hover {
        border-bottom-color: ${({ $isSelected, ...props }) =>
            !$isSelected && mapElevationToBorder(props)};
    }
`;

export type TabID = 'amount' | 'io' | 'chained' | 'data';

type AdvancedTxDetailsProps = {
    defaultTab?: TabID;
    network: Network;
    accountType: AccountType;
    tx: WalletAccountTransaction;
    chainedTxs?: ChainedTransactions;
    explorerUrl: string;
    isPhishingTransaction: boolean;
};

export const AdvancedTxDetails = ({
    defaultTab,
    network,
    accountType,
    tx,
    chainedTxs,
    explorerUrl,
    isPhishingTransaction,
}: AdvancedTxDetailsProps) => {
    const [selectedTab, setSelectedTab] = useState<TabID>(defaultTab ?? 'amount');
    const { elevation } = useElevation();

    const getContent = () => {
        switch (selectedTab) {
            case 'amount':
                return <AmountDetails tx={tx} isTestnet={isTestnet(network.symbol)} />;
            case 'io':
                return <IODetails tx={tx} isPhishingTransaction={isPhishingTransaction} />;
            case 'chained':
                return (
                    chainedTxs && (
                        <ChainedTxs
                            txs={chainedTxs}
                            explorerUrl={explorerUrl}
                            accountType={accountType}
                            network={network}
                        />
                    )
                );
            case 'data':
                return <Data tx={tx} />;
            default:
                return null;
        }
    };

    return (
        <Card fillType="none">
            <Row gap={spacings.xl}>
                <TabButton
                    $elevation={elevation}
                    $isSelected={selectedTab === 'amount'}
                    onClick={() => setSelectedTab('amount')}
                >
                    <Translation id="TR_TX_TAB_AMOUNT" />
                </TabButton>

                {network.networkType !== 'ripple' && (
                    <TabButton
                        $elevation={elevation}
                        $isSelected={selectedTab === 'io'}
                        onClick={() => setSelectedTab('io')}
                    >
                        <Translation id="TR_INPUTS_OUTPUTS" />
                    </TabButton>
                )}

                {chainedTxs && (
                    <TabButton
                        $elevation={elevation}
                        $isSelected={selectedTab === 'chained'}
                        onClick={() => setSelectedTab('chained')}
                    >
                        <Translation id="TR_CHAINED_TXS" />
                    </TabButton>
                )}

                {network.networkType === 'ethereum' && tx.ethereumSpecific && (
                    <TabButton
                        $elevation={elevation}
                        $isSelected={selectedTab === 'data'}
                        onClick={() => setSelectedTab('data')}
                    >
                        <Translation id="TR_DATA" />
                    </TabButton>
                )}
            </Row>
            <Divider margin={{ top: 0, bottom: spacings.md }} />
            {getContent()}
        </Card>
    );
};
