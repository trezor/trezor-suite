import React from 'react';
import styled from 'styled-components';
import { useSendFormContext } from '@wallet-hooks';
import { Icon, variables } from '@trezor/components';
import { UtxoSelection as UtxoSelectionBase } from '@wallet-components/UtxoSelection';

const Wrapper = styled.div`
    margin-bottom: 25px;
`;

const Title = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${props => props.theme.TYPE_DARK_GREY};
    display: flex;
    flex-direction: row;
    justify-content: space-between;
`;

const Description = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

interface Props {
    close: () => void;
}

export const UtxoSelection = ({ close }: Props) => {
    const { account, getDefaultValue, toggleUtxoSelection } = useSendFormContext();

    const selectedUtxos = getDefaultValue('selectedUtxos', []);

    return (
        <Wrapper>
            <Title>
                <span>Coin selection</span>
                <Icon size={20} icon="CROSS" onClick={close} />
            </Title>
            <Description>Description how to use coins selection</Description>
            <UtxoSelectionBase
                utxos={account.utxo!}
                selectedUtxos={selectedUtxos!}
                symbol={account.symbol}
                toggleUtxoSelection={toggleUtxoSelection}
            />
        </Wrapper>
    );
};
