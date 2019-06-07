import styled from 'styled-components';
import colors from '@suite/config/onboarding/colors';

interface Props {
    // todo: typescript when isFirst is true isLast should not be possible to set to true;
    isFirst?: boolean;
    isLast?: boolean;
    transitionDuration: number;
    order: number;
    isActive: boolean;
}

const Line = styled.div<Props>`
    flex-grow: 1;
    height: 1.3px;
    visibility: ${({ isFirst, isLast }) => (isFirst || isLast ? 'hidden' : 'visible')};
    align-self: center;
    transition: all ${props => props.transitionDuration}s linear;
    transition-delay: ${props => props.transitionDuration * props.order}s;
    background: linear-gradient(to right, ${colors.brandPrimary} 50%, ${colors.gray} 50%);
    background-size: 220% 100%;
    background-position: ${props => (props.isActive ? 'right bottom' : 'left bottom')};
`;

export default Line;
