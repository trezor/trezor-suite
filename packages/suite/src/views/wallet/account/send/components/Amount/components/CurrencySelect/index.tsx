import React from 'react';
import styled from 'styled-components';
import { Select } from '@trezor/components-v2';
import { Account } from '@wallet-types';
import { LABEL_HEIGHT } from '@wallet-constants/sendForm';

const CurrencySelect = styled(Select)`
    margin-top: ${LABEL_HEIGHT}px;
    margin-left: 10px;
`;

interface Props {
    symbol: Account['symbol'];
}

const CoinSelect = (props: Props) => (
    <CurrencySelect
        key="currency"
        display="short"
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
