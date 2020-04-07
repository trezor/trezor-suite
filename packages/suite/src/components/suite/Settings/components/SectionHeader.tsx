import styled from 'styled-components';
import { colors, variables } from '@trezor/components';

const SectionHeader = styled.div`
    color: ${colors.BLACK50};
    margin: 40px 0 10px 0;
    text-transform: uppercase;
    padding-left: 12px;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.BOLD};
`;

export default SectionHeader;
