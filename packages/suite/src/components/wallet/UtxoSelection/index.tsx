import * as React from 'react';
import styled from 'styled-components';
import { RadioButton, variables } from '@trezor/components';
import { FormattedCryptoAmount } from '@suite-components';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import type { AccountUtxo } from 'trezor-connect';
import type { Network } from '@wallet-types';

const Wrapper = styled.div`
    margin-bottom: 25px;
`;

const Item = styled.div`
    display: flex;
    align-items: center;
    padding: 8px 0px;
`;

const Details = styled.div`
    display: flex;
    flex-direction: column;
`;

const DetailsRow = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

interface Props {
    utxos: AccountUtxo[];
    selectedUtxos: AccountUtxo[];
    symbol: Network['symbol'];
    toggleUtxoSelection: (utxo: AccountUtxo) => void;
}

const UtxoSelection = (props: Props) => (
    <Wrapper>
        {props.utxos.map(utxo => (
            <Item>
                <RadioButton
                    onClick={() => props.toggleUtxoSelection(utxo)}
                    isChecked={
                        !!props.selectedUtxos.find(
                            u => u.txid === utxo.txid && u.vout === utxo.vout,
                        )
                    }
                />
                <Details>
                    <FormattedCryptoAmount
                        value={formatNetworkAmount(utxo.amount, props.symbol)}
                        symbol={props.symbol}
                    />
                    <DetailsRow>Address: {utxo.address}</DetailsRow>
                    <DetailsRow>Path: {utxo.path}</DetailsRow>
                    <DetailsRow>TXID: {utxo.txid}</DetailsRow>
                    <DetailsRow>Confirmations: {utxo.confirmations}</DetailsRow>
                </Details>
            </Item>
        ))}
    </Wrapper>
);

export default UtxoSelection;
