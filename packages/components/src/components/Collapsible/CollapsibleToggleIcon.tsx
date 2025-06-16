import styled from 'styled-components';

import { useCollapsible } from './Collapsible';
import { motionEasing } from '../../config/motion';
import { Icon, IconName, IconProps } from '../Icon/Icon';

const ANIMATION_DURATION = 0.4;

const IconWrapper = styled.div<{ $isCollapsed?: boolean }>`
    transform: ${({ $isCollapsed }) => ($isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)')};
    transition: transform ${ANIMATION_DURATION}s cubic-bezier(${motionEasing.transition.join(', ')});
    transform-origin: center;
`;

type ToggleProps = {
    size?: IconProps['size'];
    iconName?: IconName;
    'data-testid'?: string;
};

export const CollapsibleToggleIcon = ({
    size,
    iconName = 'caretDown',
    'data-testid': dataTestId,
}: ToggleProps) => {
    const { isOpen } = useCollapsible();

    return (
        <IconWrapper $isCollapsed={!isOpen}>
            <Icon name={iconName} size={size} data-testid={dataTestId} variant="tertiary" />
        </IconWrapper>
    );
};
