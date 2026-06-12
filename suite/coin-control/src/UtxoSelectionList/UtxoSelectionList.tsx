import { type ReactNode } from 'react';

import styled from 'styled-components';

import { getUtxoOutpoint } from '@suite-common/wallet-utils';
import {
    Column,
    IconCircle,
    type IconCircleIntent,
    type IconName,
    Paragraph,
} from '@trezor/components';
import type { AccountUtxo, PROTO } from '@trezor/connect';
import { negativeSpacings, typography } from '@trezor/theme';

import {
    type CoinControlActions,
    type CoinControlRenderers,
    type CoinControlViewModel,
} from '../types';
import { UtxoSelection } from './UtxoSelection/UtxoSelection';

const Header = styled.header`
    align-items: center;
    display: flex;
    ${typography['body-sm']}
    gap: 16px;
    margin: 6px 0 12px;
`;

type UtxoSelectionListProps = {
    account: CoinControlViewModel['account'];
    coinjoinRegisteredUtxos: AccountUtxo[];
    coinjoinUnavailableMessages: CoinControlViewModel['coinjoinUnavailableMessages'];
    composedInputs: PROTO.TxInputType[];
    description: ReactNode;
    heading: ReactNode;
    icon: IconName;
    iconIntent?: IconCircleIntent;
    isCoinControlEnabled: boolean;
    onShowTransactionDetail: CoinControlActions['onShowTransactionDetail'];
    renderers: CoinControlRenderers;
    selectedUtxos: AccountUtxo[];
    toggleUtxoSelection: CoinControlActions['toggleUtxoSelection'];
    transactions: CoinControlViewModel['transactions'];
    utxos: AccountUtxo[];
    withHeader: boolean;
};

export const UtxoSelectionList = ({
    account,
    coinjoinRegisteredUtxos,
    coinjoinUnavailableMessages,
    composedInputs,
    description,
    heading,
    icon,
    iconIntent = 'neutral',
    isCoinControlEnabled,
    onShowTransactionDetail,
    renderers,
    selectedUtxos,
    toggleUtxoSelection,
    transactions,
    utxos,
    withHeader,
}: UtxoSelectionListProps) => (
    <Column>
        {withHeader && (
            <Header>
                <IconCircle
                    name={icon}
                    size={64}
                    intent={iconIntent}
                    margin={{ left: negativeSpacings.xs }}
                />
                <div>
                    <Paragraph typographyStyle="body-md" margin={{ bottom: 4 }}>
                        {heading}
                    </Paragraph>
                    <Paragraph typographyStyle="body-md" intent="neutral" priority="secondary">
                        {description}
                    </Paragraph>
                </div>
            </Header>
        )}
        <Column gap={4}>
            {utxos.map(utxo => (
                <UtxoSelection
                    account={account}
                    coinjoinRegisteredUtxos={coinjoinRegisteredUtxos}
                    coinjoinUnavailableMessage={coinjoinUnavailableMessages[getUtxoOutpoint(utxo)]}
                    composedInputs={composedInputs}
                    isCoinControlEnabled={isCoinControlEnabled}
                    key={`${utxo.txid}-${utxo.vout}`}
                    onShowTransactionDetail={onShowTransactionDetail}
                    renderers={renderers}
                    selectedUtxos={selectedUtxos}
                    toggleUtxoSelection={toggleUtxoSelection}
                    transaction={transactions.find(transaction => transaction.txid === utxo.txid)}
                    utxo={utxo}
                />
            ))}
        </Column>
    </Column>
);
