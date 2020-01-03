import styled from 'styled-components';
import { variables, colors } from '@trezor/components-v2';

const Badge = styled.div`
    display: flex;
    align-items: center;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: 600;
    padding: 5px;
    border-radius: 3px;
    background-color: ${colors.BLACK92};
    text-transform: uppercase;
    color: ${colors.BLACK50};
    align-self: center;
    white-space: nowrap;
`;

export default Badge;
