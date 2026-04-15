import styled from 'styled-components';

import { useCollapsible } from './CollapsibleContext';
import { motionEasing } from '../../config/motion';
import { Icon, type IconName, type IconProps } from '../Icon/Icon';

const ANIMATION_DURATION = 0.4;

const IconWrapper = styled.div<{ $isCollapsed?: boolean }>`
    transform: ${({ $isCollapsed }) => ($isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)')};
    transition: transform ${ANIMATION_DURATION}s
        cubic-bezier(${motionEasing.transition?.join(', ') ?? ''});
    transform-origin: center;
`;

type ToggleProps = {
    size?: IconProps['size'];
    iconName?: IconName;
    'data-testid'?: string;
    intent?: IconProps['intent'];
    priority?: IconProps['priority'];
    isDisabled?: IconProps['isDisabled'];
};

export const CollapsibleToggleIcon = ({
    size,
    iconName = 'caretDown',
    'data-testid': dataTestId,
    intent = 'neutral',
    priority = 'secondary',
    isDisabled = false,
}: ToggleProps) => {
    const { isOpen } = useCollapsible();

    return (
        <IconWrapper $isCollapsed={!isOpen}>
            <Icon
                name={iconName}
                size={size}
                data-testid={dataTestId}
                intent={intent}
                priority={priority}
                isDisabled={isDisabled}
            />
        </IconWrapper>
    );
};
