import styled from 'styled-components';
import { colors } from '@trezor/components';

const Badge = styled.div`
    display: flex;
    background: ${colors.BADGE_BACKGROUND};
    align-items: center;
    font-weight: 600;
    padding: 5px;
    border-radius: 3px;
    text-transform: uppercase;
    color: ${colors.BADGE_TEXT_COLOR};
    align-self: center;
    white-space: nowrap;
`;

export default Badge;
