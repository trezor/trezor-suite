import React from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { Input, Tooltip, Icon, colors } from '@trezor/components';
import commonMessages from '@wallet-views/messages';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import messages from './index.messages';
import { Props as ContainerProps } from '../../Container';

interface Props {
    errors: ContainerProps['send']['networkTypeRipple']['destinationTag']['error'];
    destinationTag: ContainerProps['send']['networkTypeRipple']['destinationTag']['value'];
    sendFormActionsRipple: ContainerProps['sendFormActionsRipple'];
}

const Label = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
`;

const StyledIcon = styled(Icon)`
    cursor: pointer;
    display: flex;
    padding-left: 5px;
    height: 100%;
`;

const getState = (
    error: ContainerProps['send']['networkTypeRipple']['destinationTag']['error'],
    destinationTag: ContainerProps['send']['networkTypeRipple']['destinationTag']['value'],
) => {
    if (error) {
        return 'error';
    }
    if (destinationTag && !error) {
        return 'success';
    }
};

const getErrorMessage = (
    error: ContainerProps['send']['networkTypeRipple']['destinationTag']['error'],
) => {
    switch (error) {
        case VALIDATION_ERRORS.NOT_NUMBER:
            return <FormattedMessage {...messages.TR_DESTINATION_TAG_IS_NOT_NUMBER} />;
        default:
            return null;
    }
};

const NetworkTypeXrp = (props: Props) => (
    <Input
        state={getState(props.errors, props.destinationTag)}
        topLabel={
            <Label>
                <FormattedMessage {...messages.TR_XRP_DESTINATION_TAG} />
                <Tooltip
                    content={<FormattedMessage {...messages.TR_XRP_DESTINATION_TAG_EXPLAINED} />}
                    maxWidth={200}
                    ctaLink="https://wiki.trezor.io/Ripple_(XRP)"
                    ctaText={<FormattedMessage {...commonMessages.TR_LEARN_MORE} />}
                    placement="top"
                >
                    <StyledIcon icon="HELP" color={colors.TEXT_SECONDARY} size={12} />
                </Tooltip>
            </Label>
        }
        bottomText={getErrorMessage(props.errors)}
        value={props.destinationTag || ''}
        onChange={e => props.sendFormActionsRipple.handleDestinationTagChange(e.target.value)}
    />
);

export default NetworkTypeXrp;
