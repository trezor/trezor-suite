import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';
import { Input } from '@trezor/components';
import sendMessages from '@wallet-views/account/index.messages';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { State } from '@wallet-types/sendForm';
import messages from './index.messages';
import { Props as ContainerProps } from '../../../../Container';

const Label = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
`;

interface Props {
    errors: State['customFee']['error'];
    customFee: State['customFee']['value'];
    maxFee: State['feeInfo']['maxFee'];
    minFee: State['feeInfo']['minFee'];
    sendFormActions: ContainerProps['sendFormActions'];
}

const getState = (error: Props['errors'], customFee: Props['customFee']) => {
    if (error) {
        return 'error';
    }
    if (customFee && !error) {
        return 'success';
    }
};

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

const CustomFee = (props: Props) => (
    <Input
        state={getState(props.errors, props.customFee)}
        topLabel={
            <Label>
                <Translation {...sendMessages.TR_FEE} />
            </Label>
        }
        bottomText={getErrorMessage(props.errors, props.maxFee, props.minFee)}
        value={props.customFee || ''}
        onChange={e => {
            props.sendFormActions.handleCustomFeeValueChange(e.target.value);
        }}
    />
);

export default CustomFee;
