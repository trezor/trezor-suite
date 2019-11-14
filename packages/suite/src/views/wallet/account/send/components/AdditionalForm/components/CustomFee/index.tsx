import React from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { Input } from '@trezor/components';
import sendMessages from '@wallet-views/account/messages';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { State } from '@wallet-types/sendForm';
import { getInputState } from '@wallet-utils/sendFormUtils';
import messages from '@wallet-views/account/send/messages';
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

const getErrorMessage = (
    error: Props['errors'],
    maxFee: Props['maxFee'],
    minFee: Props['minFee'],
) => {
    switch (error) {
        case VALIDATION_ERRORS.IS_EMPTY:
            return <FormattedMessage {...messages.TR_CUSTOM_FEE_IS_NOT_SET} />;
        case VALIDATION_ERRORS.NOT_NUMBER:
            return <FormattedMessage {...messages.TR_CUSTOM_FEE_IS_NOT_VALID} />;
        case VALIDATION_ERRORS.NOT_IN_RANGE:
            return (
                <FormattedMessage
                    {...messages.TR_CUSTOM_FEE_NOT_IN_RANGE}
                    values={{ maxFee, minFee }}
                />
            );
        default:
            return null;
    }
};

const CustomFee = (props: Props) => (
    <Input
        state={getInputState(props.errors, props.customFee)}
        topLabel={
            <Label>
                <FormattedMessage {...sendMessages.TR_FEE} />
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
