import { ReactNode } from 'react';

import { transparentize } from 'polished';
import styled from 'styled-components';

import { selectAccountTransactions } from '@suite-common/wallet-core';
import { Icon, IconName, Paragraph, useElevation } from '@trezor/components';
import type { AccountUtxo } from '@trezor/connect';
import { CSSColor, Elevation, mapElevationToBorder, typography } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';
import { useSendFormContext } from 'src/hooks/wallet';

import { UtxoSelection } from './UtxoSelection/UtxoSelection';

const Wrapper = styled.section<{ $elevation: Elevation }>`
    border-bottom: 1px solid ${mapElevationToBorder};
    margin: 12px 0 16px;
    padding-bottom: 14px;
`;

const Header = styled.header`
    align-items: center;
    display: flex;
    ${typography.hint}
    gap: 16px;
    margin: 6px 0 12px;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledIcon = styled(Icon)<{ $backgroundColor?: string }>`
    background: ${({ $backgroundColor }) =>
        $backgroundColor && transparentize(0.9, $backgroundColor)};
    border-radius: 50%;
    margin-left: -8px;
    padding: 20px;
`;

interface UtxoSelectionListProps {
    description: ReactNode;
    heading: ReactNode;
    icon: IconName;
    iconColor?: CSSColor;
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
    const { elevation } = useElevation();
    const { account } = useSendFormContext();

    const accountTransactions = useSelector(state => selectAccountTransactions(state, account.key));

    return (
        <Wrapper $elevation={elevation}>
            {withHeader && (
                <Header>
                    <StyledIcon
                        name={icon}
                        size={20}
                        color={iconColor}
                        $backgroundColor={iconColor}
                    />
                    <div>
                        <Paragraph typographyStyle="body" margin={{ bottom: 4 }}>
                            {heading}
                        </Paragraph>
                        <Paragraph typographyStyle="body" variant="tertiary">
                            {description}
                        </Paragraph>
                    </div>
                </Header>
            )}
            {utxos.map(utxo => (
                <UtxoSelection
                    key={`${utxo.txid}-${utxo.vout}`}
                    transaction={accountTransactions.find(
                        transaction => transaction.txid === utxo.txid,
                    )}
                    utxo={utxo}
                />
            ))}
        </Wrapper>
    );
};
