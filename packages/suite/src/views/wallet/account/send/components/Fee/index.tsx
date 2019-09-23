import React from 'react';
import { colors, Select, P } from '@trezor/components';
import styled from 'styled-components';
import { injectIntl, InjectedIntl, FormattedMessage } from 'react-intl';
import accountMessages from '@wallet-views/account/messages';
import { DispatchProps } from '../../Container';
import { Fee, Account } from '@wallet-types';

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
    symbol: Account['symbol'];
    sendFormActions: DispatchProps['sendFormActions'];
    intl: InjectedIntl;
}

const getValue = (fees: Fee, symbol: Account['symbol']) => {
    return fees[symbol].length === 1 ? fees[symbol] : fees[symbol][0];
};

const FeeComponent = (props: Props) => (
    <Wrapper>
        <Label>
            <FormattedMessage {...accountMessages.TR_FEE} />
        </Label>
        <Select
            isSearchable={false}
            isClearable={false}
            value={getValue(props.fees, props.symbol)}
            onChange={feeValue => props.sendFormActions.handleFeeValueChange(feeValue)}
            options={props.fees[props.symbol]}
            formatOptionLabel={option => (
                <OptionWrapper>
                    <OptionLabel>{option.label}</OptionLabel>
                    <OptionValue>
                        {option.value} {props.symbol.toUpperCase()}
                    </OptionValue>
                </OptionWrapper>
            )}
        />
    </Wrapper>
);

export default injectIntl(FeeComponent);
