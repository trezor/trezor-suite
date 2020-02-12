import React from 'react';
import styled from 'styled-components';
import { Input, Icon, colors, Tooltip } from '@trezor/components-v2';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { getInputState } from '@wallet-utils/sendFormUtils';
import { Translation } from '@suite-components/Translation';
import { State } from '@wallet-types/sendForm';
import messages from '@suite/support/messages';
import { Props } from './Container';

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

const getErrorMessage = (error: State['networkTypeRipple']['destinationTag']['error']) => {
    switch (error) {
        case VALIDATION_ERRORS.NOT_NUMBER:
            return <Translation {...messages.TR_DESTINATION_TAG_IS_NOT_NUMBER} />;
        default:
            return null;
    }
};

const AdvancedFormRipple = ({ send, sendFormActionsRipple }: Props) => {
    if (!send) return null;
    const { networkTypeRipple } = send;
    const { destinationTag } = networkTypeRipple;
    const { error, value } = destinationTag;

    return (
        <Input
            state={getInputState(error, value)}
            display="block"
            variant="small"
            topLabel={
                <Label>
                    <Translation {...messages.TR_XRP_DESTINATION_TAG} />
                    <Tooltip placement="top" content="Tooltip destination tag">
                        <StyledIcon size={16} color={colors.BLACK50} icon="QUESTION" />
                    </Tooltip>
                </Label>
            }
            bottomText={getErrorMessage(error)}
            value={value || ''}
            onChange={e => sendFormActionsRipple.handleDestinationTagChange(e.target.value)}
        />
    );
};

export default AdvancedFormRipple;
