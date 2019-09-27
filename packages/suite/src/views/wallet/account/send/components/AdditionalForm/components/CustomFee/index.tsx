import React from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { Input } from '@trezor/components';
import sendMessages from '@wallet-views/account/messages';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import messages from '../../index.messages';
import { Props as ContainerProps } from '../../../../Container';

const Label = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
`;

interface Props {
    errors: ContainerProps['send']['errors']['customFee'];
    customFee: ContainerProps['send']['customFee'];
    sendFormActions: ContainerProps['sendFormActions'];
}

const getState = (
    error: ContainerProps['send']['errors']['customFee'],
    customFee: ContainerProps['send']['customFee'],
) => {
    if (error) {
        return 'error';
    }
    if (customFee && !error) {
        return 'success';
    }
};

const getErrorMessage = (error: ContainerProps['send']['errors']['customFee']) => {
    switch (error) {
        case VALIDATION_ERRORS.IS_EMPTY:
            return <FormattedMessage {...messages.TR_CUSTOM_FEE_IS_NOT_SET} />;
        case VALIDATION_ERRORS.NOT_NUMBER:
            return <FormattedMessage {...messages.TR_CUSTOM_FEE_IS_NOT_VALID} />;
        default:
            return null;
    }
};

const CustomFee = (props: Props) => (
    <Input
        state={getState(props.errors, props.customFee)}
        topLabel={
            <Label>
                <FormattedMessage {...sendMessages.TR_FEE} />
            </Label>
        }
        bottomText={getErrorMessage(props.errors)}
        value={props.customFee || ''}
        onChange={e => {
            props.sendFormActions.handleCustomFeeValueChange(e.target.value);
        }}
    />
);

export default CustomFee;
