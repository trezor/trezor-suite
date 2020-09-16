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
    size?: number;
    className?: string;
    color?: string;
}

const QuestionTooltip = ({
    messageId,
    size = 16,
    color = colors.NEUE_TYPE_LIGHT_GREY,
    className,
}: Props) => (
    <Tooltip className={className} placement="top" content={<Translation id={messageId} />}>
        <StyledIcon size={size} color={color} icon="QUESTION" />
    </Tooltip>
);

export default QuestionTooltip;
