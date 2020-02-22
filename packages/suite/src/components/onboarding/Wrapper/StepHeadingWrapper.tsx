import styled from 'styled-components';

import { variables } from '@trezor/components';

const { FONT_SIZE, FONT_WEIGHT } = variables;

const StepHeadingWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    font-weight: ${FONT_WEIGHT.REGULAR};
    font-size: ${FONT_SIZE.H2};
`;

export default StepHeadingWrapper;
