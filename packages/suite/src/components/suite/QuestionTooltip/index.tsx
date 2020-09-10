import { Translation } from '@suite-components';
import styled from 'styled-components';
import messages from '@suite/support/messages';
import { Icon, colors, Tooltip } from '@trezor/components';
import React from 'react';

const StyledIcon = styled(Icon)`
    cursor: pointer;
`;

interface Props {
    messageId: keyof typeof messages;
}

const QuestionTooltip = ({ messageId }: Props) => (
    <Tooltip placement="top" content={<Translation id={messageId} />}>
        <StyledIcon size={16} color={colors.BLACK50} icon="QUESTION" />
    </Tooltip>
);

export default QuestionTooltip;
