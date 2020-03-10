import { Translation } from '@suite-components';
import styled from 'styled-components';

import { Icon, colors, Tooltip } from '@trezor/components';
import React from 'react';

const StyledIcon = styled(Icon)`
    cursor: pointer;
`;

interface Props {
    messageId: keyof typeof messages;
}

export default ({ messageId }: Props) => (
    <Tooltip placement="top" content={<Translation id="messageId]" />}>
        <StyledIcon size={16} color={colors.BLACK50} icon="QUESTION" />
    </Tooltip>
);
