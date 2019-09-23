import React from 'react';
import styled from 'styled-components';
import { variables, Select, Input } from '@trezor/components';
import { State } from '@wallet-reducers/sendFormReducer';
import { DispatchProps } from '../../../../Container';
import { FIAT } from '@suite-config';

const Wrapper = styled.div`
    display: flex;
    align-self: flex-end;
    width: 280px;
`;

const getCurrencyOptions = (currency: string) => {
    return { value: currency, label: currency.toUpperCase() };
};

const LocalCurrencySelect = styled(Select)`
    width: 80px;
    height: 40px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        flex: 1 1 0;
    }
`;

const LocalCurrencyInput = styled(Input)`
    min-width: 100px;
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
    value: State['fiatValue'];
    localCurrency: State['localCurrency'];
    state: 'error' | undefined;
    sendFormActions: DispatchProps['sendFormActions'];
}

const Fiat = (props: Props) => (
    <Wrapper>
        <EqualsSign>=</EqualsSign>
        <LocalCurrencyInput
            state={props.state}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            value={props.value || ''}
            onChange={e => props.sendFormActions.handleFiatInputChange(e.target.value)}
            sideAddons={
                <LocalCurrencySelect
                    key="local-currency"
                    isSearchable
                    isClearable={false}
                    onChange={(option: State['localCurrency']) =>
                        props.sendFormActions.handleSelectCurrencyChange(option)
                    }
                    value={props.localCurrency}
                    options={FIAT.currencies.map((currency: string) =>
                        getCurrencyOptions(currency),
                    )}
                />
            }
        />
    </Wrapper>
);

export default Fiat;
