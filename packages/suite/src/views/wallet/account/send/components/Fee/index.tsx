import React from 'react';
import { colors, Select, P } from '@trezor/components';
import styled from 'styled-components';
import { injectIntl, InjectedIntl, FormattedMessage } from 'react-intl';
import accountMessages from '@wallet-views/account/messages';
import { FeeItem } from '@wallet-reducers/feesReducer';
import { DispatchProps } from '../../Container';
import { Fee, Account } from '@wallet-types';

const CUSTOM_FEE = 'custom';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Label = styled.span`
    color: ${colors.TEXT_SECONDARY};
    padding-bottom: 10px;
`;

const OptionWrapper = styled.div`
    display: flex;
    justify-content: space-between;
`;

const OptionValue = styled(P)`
    min-width: 70px;
    margin-right: 5px;
`;

const OptionLabel = styled(P)`
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: right;
    word-break: break-all;
`;

interface Props {
    fees: Fee;
    fee: null | FeeItem;
    symbol: Account['symbol'];
    sendFormActions: DispatchProps['sendFormActions'];
    intl: InjectedIntl;
}

const getValue = (fees: Fee, symbol: Account['symbol']) => {
    return fees[symbol].length === 1 ? fees[symbol] : fees[symbol][0];
};

const capitalize = (s: string) => {
    return s.charAt(0).toUpperCase() + s.slice(1);
};

const addCustom = (option: FeeItem[]) => {
    const result = option;
    if (!result.find(i => i.value === CUSTOM_FEE)) {
        result.push({ label: CUSTOM_FEE, value: CUSTOM_FEE });
    }
    return result;
};

const FeeComponent = (props: Props) => (
    <Wrapper>
        <Label>
            <FormattedMessage {...accountMessages.TR_FEE} />
        </Label>
        <Select
            isSearchable={false}
            isClearable={false}
            value={props.fee || getValue(props.fees, props.symbol)}
            onChange={feeValue => props.sendFormActions.handleFeeValueChange(feeValue)}
            options={addCustom(props.fees[props.symbol])}
            formatOptionLabel={option => (
                <OptionWrapper>
                    <OptionLabel>{capitalize(option.label)}</OptionLabel>
                    {option.label !== CUSTOM_FEE && (
                        <OptionValue>
                            {option.value} {props.symbol.toUpperCase()}
                        </OptionValue>
                    )}
                </OptionWrapper>
            )}
        />
    </Wrapper>
);

export default injectIntl(FeeComponent);
