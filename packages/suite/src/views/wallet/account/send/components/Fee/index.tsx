import React from 'react';
import { colors, Select, P } from '@trezor/components';
import styled from 'styled-components';
import { injectIntl, InjectedIntl, FormattedMessage } from 'react-intl';
import accountMessages from '@wallet-views/account/messages';
import { DispatchProps } from '../../Container';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const FeeLabel = styled.span`
    color: ${colors.TEXT_SECONDARY};
    padding-bottom: 10px;
`;

const FeeOptionWrapper = styled.div`
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
    fees: any; // TODO ts
    symbol: string;
    sendFormActions: DispatchProps['sendFormActions'];
    intl: InjectedIntl;
}

const getValue = (fees, symbol) => {
    let value;
    try {
        value = fees[symbol];
    } catch {
        value = { label: 'High', value: '0.000012' };
    }
    return value;
};

const Fee = (props: Props) => (
    <Wrapper>
        <FeeLabel>
            <FormattedMessage {...accountMessages.TR_FEE} />
        </FeeLabel>
        <Select
            isSearchable={false}
            isClearable={false}
            value={getValue(props.fees, props.symbol)}
            onChange={feeValue => props.sendFormActions.handleFeeValueChange(feeValue)}
            options={[{ label: 'High', value: '0.000012' }]}
            formatOptionLabel={option => (
                <FeeOptionWrapper>
                    <OptionLabel>{option.label}</OptionLabel>
                    <OptionValue>
                        {option.value} {props.symbol.toUpperCase()}
                    </OptionValue>
                </FeeOptionWrapper>
            )}
        />
    </Wrapper>
);

export default injectIntl(Fee);
