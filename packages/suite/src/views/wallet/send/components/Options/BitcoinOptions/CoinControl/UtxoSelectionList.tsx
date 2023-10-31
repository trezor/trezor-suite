import { ReactNode } from 'react';
import styled from 'styled-components';
import { transparentize } from 'polished';

import { selectAccountTransactionsWithNulls } from '@suite-common/wallet-core';
import { Icon, variables, IconType } from '@trezor/components';
import { useSelector } from 'src/hooks/suite';
import type { AccountUtxo } from '@trezor/connect';
import { useSendFormContext } from 'src/hooks/wallet';
import { UtxoSelection } from './UtxoSelection';

const Wrapper = styled.section`
    border-bottom: 1px solid ${({ theme }) => theme.STROKE_GREY};
    margin: 12px 0 16px;
    padding-bottom: 14px;
`;

const Header = styled.header`
    align-items: center;
    display: flex;
    font-size: ${variables.FONT_SIZE.SMALL};
    gap: 16px;
    margin: 6px 0 12px;
`;

const Heading = styled.div`
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    margin-bottom: 4px;
`;

const Description = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const StyledIcon = styled(Icon)<{ backgroundColor?: string }>`
    background: ${({ backgroundColor }) => backgroundColor && transparentize(0.9, backgroundColor)};
    border-radius: 50%;
    margin-left: -8px;
    padding: 20px;
`;

interface UtxoSelectionListProps {
    description: ReactNode;
    heading: ReactNode;
    icon: IconType;
    iconColor?: string;
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

    const accountTransactions = useSelector(state =>
        selectAccountTransactionsWithNulls(state, account.key),
    );

    return (
        <Wrapper>
            {withHeader && (
                <Header>
                    <StyledIcon
                        icon={icon}
                        size={20}
                        color={iconColor}
                        backgroundColor={iconColor}
                    />
                    <div>
                        <Heading>{heading}</Heading>
                        <Description>{description}</Description>
                    </div>
                </Header>
            )}
            {utxos.map(utxo => (
                <UtxoSelection
                    key={`${utxo.txid}-${utxo.vout}`}
                    transaction={accountTransactions.find(
                        transaction => transaction?.txid === utxo.txid,
                    )}
                    utxo={utxo}
                />
            ))}
        </Wrapper>
    );
};
