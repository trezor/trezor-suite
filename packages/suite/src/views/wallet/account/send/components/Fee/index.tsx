import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { colors, P, Select } from '@trezor/components';
import { Account } from '@wallet-types';
import { FeeLevel } from '@wallet-types/sendForm';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import React from 'react';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import styled from 'styled-components';

import { DispatchProps } from '../../Container';

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

const StyledSelect = styled(Select)``;

interface Props extends WrappedComponentProps {
    feeLevels: FeeLevel[];
    selectedFee: FeeLevel;
    symbol: Account['symbol'];
    networkType: Account['networkType'];
    onChange: DispatchProps['sendFormActions']['handleFeeValueChange'];
}

const capitalize = (s: string) => {
    return s.charAt(0).toUpperCase() + s.slice(1);
};

const getValue = (
    networkType: Account['networkType'],
    value: string,
    symbol: Account['symbol'],
) => {
    if (networkType === 'bitcoin') {
        return `${value} sat/B`;
    }
    return `${formatNetworkAmount(value, symbol)} ${symbol.toUpperCase()}`;
};

const FeeComponent = (props: Props) => (
    <Wrapper>
        <Label>
            <Translation {...messages.TR_FEE} />
        </Label>
        <StyledSelect
            isSearchable={false}
            isClearable={false}
            value={props.selectedFee}
            onChange={props.onChange}
            options={props.feeLevels}
            formatOptionLabel={(option: FeeLevel) => (
                <OptionWrapper>
                    <OptionLabel>{capitalize(option.label)}</OptionLabel>
                    <OptionValue>
                        {getValue(props.networkType, option.value, props.symbol)}
                    </OptionValue>
                </OptionWrapper>
            )}
        />
    </Wrapper>
);

export default injectIntl(FeeComponent);
