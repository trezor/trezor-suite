import React from 'react';
import styled from 'styled-components';
import { Select } from '@trezor/components-v2';
import { Account } from '@wallet-types';
import { LABEL_HEIGHT } from '@wallet-constants/sendForm';

const Wrapper = styled.div`
    width: 100px;
    margin-left: 10px;
`;

const CurrencySelect = styled(Select)`
    margin-top: ${LABEL_HEIGHT}px;
`;

interface Props {
    symbol: Account['symbol'];
}

const CoinSelect = (props: Props) => (
    <Wrapper>
        <CurrencySelect
            key="currency"
            display="block"
            isSearchable={false}
            isClearable={false}
            value={{
                value: props.symbol,
                label: props.symbol.toUpperCase(),
            }}
            isDisabled
            options={null}
        />
    </Wrapper>
);

export default CoinSelect;
