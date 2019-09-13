import React from 'react';
import styled from 'styled-components';
import { Select } from '@trezor/components';
import { Account } from '@wallet-types';

const CurrencySelect = styled(Select)`
    min-width: 77px;
    height: 40px;
    flex: 0.2;
`;

interface Props {
    symbol: Account['symbol'];
}

const CoinSelect = (props: Props) => (
    <CurrencySelect
        key="currency"
        isSearchable={false}
        isClearable={false}
        value={{
            value: props.symbol,
            label: props.symbol.toUpperCase(),
        }} // TODO select ethereum tokens and other tokens
        isDisabled
        options={null}
    />
);

export default CoinSelect;
