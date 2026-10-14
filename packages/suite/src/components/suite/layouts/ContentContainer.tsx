import styled from 'styled-components';

import { HORIZONTAL_LAYOUT_PADDINGS, MAX_CONTENT_WIDTH } from 'src/constants/suite/layout';

export const ContentContainer = styled.div<{ $isContentStatic?: boolean }>`
    position: relative;
    display: flex;
    flex-direction: column;
    flex: 1;
    width: 100%;
    max-width: ${({ $isContentStatic }) => ($isContentStatic ? 'none' : MAX_CONTENT_WIDTH)};
    padding: ${({ $isContentStatic }) =>
        $isContentStatic ? '0' : `32px ${HORIZONTAL_LAYOUT_PADDINGS} 48px`};

    /* A static content page owns the area, so it must not be able to push the layout taller. */
    min-height: ${({ $isContentStatic }) => ($isContentStatic ? '0' : 'auto')};
`;
