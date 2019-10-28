import React from 'react';
import { colors, Select, P } from '@trezor/components';
import styled from 'styled-components';
import { CUSTOM_FEE } from '@wallet-constants/sendForm';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { FeeLevel } from '@wallet-types/sendForm';
import { injectIntl, WrappedComponentProps, FormattedMessage } from 'react-intl';
import accountMessages from '@wallet-views/account/messages';
import { DispatchProps } from '../../Container';
import { Account } from '@wallet-types';

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
            <FormattedMessage {...accountMessages.TR_FEE} />
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
                    {option.label !== CUSTOM_FEE && (
                        <OptionValue>
                            {getValue(props.networkType, option.value, props.symbol)}
                        </OptionValue>
                    )}
                </OptionWrapper>
            )}
        />
    </Wrapper>
);

export default injectIntl(FeeComponent);
