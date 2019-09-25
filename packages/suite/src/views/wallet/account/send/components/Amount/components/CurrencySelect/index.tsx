import React from 'react';
import styled from 'styled-components';
import { Select } from '@trezor/components';
import { Account } from '@wallet-types';

const CurrencySelect = styled(Select)`
    width: 60px;
    height: 40px;
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
        }}
        isDisabled
        options={null}
    />
);

export default CoinSelect;
