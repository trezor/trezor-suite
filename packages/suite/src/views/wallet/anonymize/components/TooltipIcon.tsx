import React from 'react';
import styled from 'styled-components';

import { Translation } from '@suite-components';
import { ExtendedMessageDescriptor } from '@suite-types';
import { Icon, Tooltip } from '@trezor/components';

const StyledIcon = styled(Icon)`
    margin-left: 6px;
`;

interface TooltipIconProps {
    message: ExtendedMessageDescriptor['id'];
}

export const TooltipIcon = ({ message }: TooltipIconProps) => (
    <Tooltip interactive={false} content={<Translation id={message} />}>
        <StyledIcon icon="INFO" size={14} />
    </Tooltip>
);
