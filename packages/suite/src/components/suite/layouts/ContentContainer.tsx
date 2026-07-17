import styled from 'styled-components';

import { HORIZONTAL_LAYOUT_PADDINGS, MAX_CONTENT_WIDTH } from 'src/constants/suite/layout';

export const ContentContainer = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    flex: 1;
    width: 100%;
    max-width: ${MAX_CONTENT_WIDTH};
    padding: 32px ${HORIZONTAL_LAYOUT_PADDINGS} 48px;
`;
