import { useState } from 'react';

import { Tabs, Card } from '@trezor/components';
import { isTestnet } from '@suite-common/wallet-utils';
import { WalletAccountTransaction, ChainedTransactions } from '@suite-common/wallet-types';
import { AccountType, Network } from '@suite-common/wallet-config';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';

import { AmountDetails } from './AmountDetails';
import { IODetails } from './IODetails/IODetails';
import { ChainedTxs } from '../ChainedTxs';
import { Data } from './Data';

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
            <Tabs activeItemId={selectedTab} margin={{ bottom: spacings.md }}>
                <Tabs.Item id="amount" onClick={() => setSelectedTab('amount')}>
                    <Translation id="TR_TX_TAB_AMOUNT" />
                </Tabs.Item>
                {network.networkType !== 'ripple' && (
                    <Tabs.Item id="io" onClick={() => setSelectedTab('io')}>
                        <Translation id="TR_INPUTS_OUTPUTS" />
                    </Tabs.Item>
                )}
                {chainedTxs && (
                    <Tabs.Item id="chained" onClick={() => setSelectedTab('chained')}>
                        <Translation id="TR_CHAINED_TXS" />
                    </Tabs.Item>
                )}
                {network.networkType === 'ethereum' && tx.ethereumSpecific && (
                    <Tabs.Item id="data" onClick={() => setSelectedTab('data')}>
                        <Translation id="TR_DATA" />
                    </Tabs.Item>
                )}
            </Tabs>
            {getContent()}
        </Card>
    );
};
