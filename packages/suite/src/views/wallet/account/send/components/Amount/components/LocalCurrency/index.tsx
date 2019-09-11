import React from 'react';
import styled from 'styled-components';
import { variables, Select, Input } from '@trezor/components';
import { State } from '@wallet-reducers/sendFormReducer';
import { DispatchProps } from '../../../../Container';
import { FIAT } from '@suite-config';

const Wrapper = styled.div`
    display: flex;
    align-self: flex-end;
    max-width: 300px;
`;

const getCurrencyOptions = (currency: string) => {
    return { value: currency, label: currency.toUpperCase() };
};

const LocalCurrencySelect = styled(Select)`
    min-width: 77px;
    height: 40px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        flex: 1 1 0;
    }
`;

const LocalCurrencyInput = styled(Input)`
    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        flex: 1 1 100%;
    }
`;

const EqualsSign = styled.div`
    align-self: center;
    padding: 0 10px;
    font-size: ${variables.FONT_SIZE.BIGGER};

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        display: none;
    }
`;

interface Props {
    localCurrency: string;
    state: 'error' | undefined;
    sendFormActions: DispatchProps['sendFormActions'];
}

const LocalCurrency = (props: Props) => (
    <Wrapper>
        <EqualsSign>=</EqualsSign>
        <LocalCurrencyInput
            state={props.state}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            value={props.localCurrency}
            onChange={() => {}}
            sideAddons={[
                <LocalCurrencySelect
                    key="local-currency"
                    isSearchable
                    isClearable={false}
                    onChange={e => props.sendFormActions.handleLocalCurrencyChange(e.target.value)}
                    value={props.localCurrency}
                    options={FIAT.currencies.map((currency: string) =>
                        getCurrencyOptions(currency),
                    )}
                />,
            ]}
        />
    </Wrapper>
);

export default LocalCurrency;
