import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';
import { Input, Tooltip, Icon, colors } from '@trezor/components';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { State } from '@wallet-types/sendForm';
import globalMessages from '@suite-support/Messages';
import messages from './index.messages';
import { Props as ContainerProps } from '../../Container';

interface Props {
    errors: State['networkTypeRipple']['destinationTag']['error'];
    destinationTag: State['networkTypeRipple']['destinationTag']['value'];
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

const getState = (error: Props['errors'], destinationTag: Props['destinationTag']) => {
    if (error) {
        return 'error';
    }
    if (destinationTag && !error) {
        return 'success';
    }
};

const getErrorMessage = (error: Props['errors']) => {
    switch (error) {
        case VALIDATION_ERRORS.NOT_NUMBER:
            return <Translation {...messages.TR_DESTINATION_TAG_IS_NOT_NUMBER} />;
        default:
            return null;
    }
};

const NetworkTypeXrp = (props: Props) => (
    <Input
        state={getState(props.errors, props.destinationTag)}
        topLabel={
            <Label>
                <Translation {...messages.TR_XRP_DESTINATION_TAG} />
                <Tooltip
                    content={<Translation {...messages.TR_XRP_DESTINATION_TAG_EXPLAINED} />}
                    maxWidth={200}
                    // todo: link into config
                    ctaLink="https://wiki.trezor.io/Ripple_(XRP)"
                    ctaText={<Translation {...globalMessages.TR_LEARN_MORE_LINK} />}
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
