import React from 'react';

import styled from 'styled-components';

import { useCollapsible } from './Collapsible';
import { motionEasing } from '../../config/motion';
import { IconProps } from '../Icon/Icon';
import { Icon } from '../Icon/Icon';

const ANIMATION_DURATION = 0.4;

const IconWrapper = styled.div<{ $isCollapsed?: boolean }>`
    transform: ${({ $isCollapsed }) => ($isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)')};
    transition: transform ${ANIMATION_DURATION}s cubic-bezier(${motionEasing.transition.join(', ')});
    transform-origin: center;
`;

type ToggleProps = {
    size?: IconProps['size'];
    icon?: React.ReactElement<IconProps>;
    'data-testid'?: string;
};

export const CollapsibleToggleIcon = ({
    size,
    icon = <Icon name="caretDown" />,
    'data-testid': dataTestId,
}: ToggleProps) => {
    const { isOpen } = useCollapsible();

    return (
        <IconWrapper $isCollapsed={!isOpen}>
            {React.cloneElement(icon, {
                size,
                'data-testid': dataTestId,
                variant: 'tertiary',
            })}
        </IconWrapper>
    );
};
