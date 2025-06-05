import styled from 'styled-components';

import { motionEasing } from '../../config/motion';
import { Icon, IconName, IconProps } from '../Icon/Icon';

const ANIMATION_DURATION = 0.4;

const IconWrapper = styled.div<{ $isCollapsed?: boolean }>`
    transform: ${({ $isCollapsed }) => ($isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)')};
    transition: transform ${ANIMATION_DURATION}s cubic-bezier(${motionEasing.transition.join(', ')});
    transform-origin: center;
`;

type ToggleProps = {
    isOpen: boolean;
    size?: IconProps['size'];
    iconName?: IconName;
    'data-testid'?: string;
};

export const CollapsibleToggleIcon = ({
    isOpen,
    size,
    iconName = 'caretUp',
    'data-testid': dataTestId,
}: ToggleProps) => (
    <IconWrapper $isCollapsed={!isOpen}>
        <Icon name={iconName} size={size} data-testid={dataTestId} variant="tertiary" />
    </IconWrapper>
);
