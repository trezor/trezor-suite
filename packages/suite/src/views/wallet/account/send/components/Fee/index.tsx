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
    fees: any;
    symbol: string;
    sendFormActions: DispatchProps['sendFormActions'];
    intl: InjectedIntl;
}

const Fee = (props: Props) => (
    <Wrapper>
        <FeeLabel>
            <FormattedMessage {...accountMessages.TR_FEE} />
        </FeeLabel>
        <Select
            isSearchable={false}
            isClearable={false}
            value={props.fees[props.symbol][0]}
            onChange={feeValue => props.sendFormActions.handleFeeValueChange(feeValue)}
            options={props.fees[props.symbol]}
            formatOptionLabel={option => (
                <FeeOptionWrapper>
                    <OptionLabel>{option.label}</OptionLabel>
                    <OptionValue>{option.value}</OptionValue>
                </FeeOptionWrapper>
            )}
        />
    </Wrapper>
);

export default injectIntl(Fee);
