import { type ReactNode } from 'react';

import styled from 'styled-components';

import { selectAccountTransactions } from '@suite-common/wallet-core';
import {
    Column,
    IconCircle,
    type IconCircleIntent,
    type IconComponent,
    Paragraph,
} from '@trezor/components';
import type { AccountUtxo } from '@trezor/connect';
import { negativeSpacings, typography } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';
import { useSendFormContext } from 'src/hooks/wallet';

import { UtxoSelection } from './UtxoSelection/UtxoSelection';

const Header = styled.header`
    align-items: center;
    display: flex;
    ${typography['body-sm']}
    gap: 16px;
    margin: 6px 0 12px;
`;

interface UtxoSelectionListProps {
    description: ReactNode;
    heading: ReactNode;
    icon: IconComponent;
    iconIntent?: IconCircleIntent;
    utxos: AccountUtxo[];
    withHeader: boolean;
}

export const UtxoSelectionList = ({
    description,
    heading,
    icon,
    iconIntent = 'neutral',
    utxos,
    withHeader,
}: UtxoSelectionListProps) => {
    const { account } = useSendFormContext();

    const accountTransactions = useSelector(state => selectAccountTransactions(state, account.key));

    return (
        <Column>
            {withHeader && (
                <Header>
                    <IconCircle
                        icon={icon}
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
                        key={`${utxo.txid}-${utxo.vout}`}
                        transaction={accountTransactions.find(
                            transaction => transaction.txid === utxo.txid,
                        )}
                        utxo={utxo}
                    />
                ))}
            </Column>
        </Column>
    );
};
