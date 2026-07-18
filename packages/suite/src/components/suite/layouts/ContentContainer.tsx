import { type ComponentPropsWithRef, type ComponentType } from 'react';

import styled from 'styled-components';

import { spacingsPx } from '@trezor/theme';

import { HORIZONTAL_LAYOUT_PADDINGS, MAX_CONTENT_WIDTH } from 'src/constants/suite/layout';

export const ContentContainer: ComponentType<ComponentPropsWithRef<'div'>> = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    flex: 1;
    width: 100%;
    max-width: ${MAX_CONTENT_WIDTH};
    padding: ${spacingsPx.xxl} ${HORIZONTAL_LAYOUT_PADDINGS} ${spacingsPx.xxxxl};
`;
