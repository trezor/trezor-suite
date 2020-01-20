import React from 'react';
import styled from 'styled-components';
import { Account } from '@wallet-types';
import { Translation } from '@suite-components/Translation';
import { Input, Select } from '@trezor/components-v2';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { State } from '@wallet-types/sendForm';
import { getInputState } from '@wallet-utils/sendFormUtils';
import messages from '@suite/support/messages';
import { Props as ContainerProps } from '../../../../../../Container';

const Wrapper = styled.div`
    display: flex;
`;

const ItemWrapper = styled.div`
    min-width: 80px;
    max-width: 80px;
    padding-right: 10px;
`;

interface Props {
    errors: State['customFee']['error'];
    symbol: Account['symbol'];
    networkType: Account['networkType'];
    selectedFee: State['selectedFee'];
    customFee: State['customFee']['value'];
    maxFee: State['feeInfo']['maxFee'];
    minFee: State['feeInfo']['minFee'];
    sendFormActions: ContainerProps['sendFormActions'];
}

const getErrorMessage = (
    error: Props['errors'],
    maxFee: Props['maxFee'],
    minFee: Props['minFee'],
) => {
    switch (error) {
        case VALIDATION_ERRORS.IS_EMPTY:
            return <Translation {...messages.TR_CUSTOM_FEE_IS_NOT_SET} />;
        case VALIDATION_ERRORS.NOT_NUMBER:
            return <Translation {...messages.TR_CUSTOM_FEE_IS_NOT_VALID} />;
        case VALIDATION_ERRORS.NOT_IN_RANGE:
            return (
                <Translation {...messages.TR_CUSTOM_FEE_NOT_IN_RANGE} values={{ maxFee, minFee }} />
            );
        default:
            return null;
    }
};

const getUnits = (networkType: Account['networkType']) => {
    if (networkType === 'bitcoin') {
        return { value: 'sat', label: 'sat/B' };
    }
    if (networkType === 'ripple') {
        return { value: 'drop', label: 'drops' };
    }
};

const CustomFee = (props: Props) => (
    <Wrapper>
        <ItemWrapper>
            <Input
                display="block"
                variant="small"
                state={getInputState(props.errors, props.customFee)}
                bottomText={getErrorMessage(props.errors, props.maxFee, props.minFee)}
                value={props.customFee}
                onChange={e => {
                    props.sendFormActions.handleCustomFeeValueChange(e.target.value);
                }}
            />
        </ItemWrapper>
        <ItemWrapper>
            <Select
                display="block"
                variant="small"
                isDisabled
                value={getUnits(props.networkType)}
            />
        </ItemWrapper>
    </Wrapper>
);

export default CustomFee;
