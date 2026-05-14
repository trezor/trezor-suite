import { type ReactNode } from 'react';

import { transparentize } from 'polished';
import styled from 'styled-components';

import { selectAccountTransactions } from '@suite-common/wallet-core';
import { Column, Icon, type IconName, Paragraph } from '@trezor/components';
import type { AccountUtxo } from '@trezor/connect';
import { type Color, typography } from '@trezor/theme';

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

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledIcon = styled(Icon)<{ $backgroundColor?: Color }>`
    background: ${({ $backgroundColor, theme }) =>
        $backgroundColor && transparentize(0.9, theme[$backgroundColor])};
    border-radius: 50%;
    margin-left: -8px;
    padding: 20px;
`;

interface UtxoSelectionListProps {
    description: ReactNode;
    heading: ReactNode;
    icon: IconName;
    iconColor?: Color;
    utxos: AccountUtxo[];
    withHeader: boolean;
}

export const UtxoSelectionList = ({
    description,
    heading,
    icon,
    iconColor,
    utxos,
    withHeader,
}: UtxoSelectionListProps) => {
    const { account } = useSendFormContext();

    const accountTransactions = useSelector(state => selectAccountTransactions(state, account.key));

    return (
        <Column>
            {withHeader && (
                <Header>
                    <StyledIcon
                        name={icon}
                        size={20}
                        color={iconColor}
                        $backgroundColor={iconColor}
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
