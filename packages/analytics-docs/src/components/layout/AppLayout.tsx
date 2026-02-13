import styled from 'styled-components';

import { hexToRgba } from '@trezor/utils';

export const TopBar = styled.div`
    gap: 12px;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background: ${({ theme }) => hexToRgba(theme.backgroundSurfaceElevation0, 0.8)};
    box-shadow: ${({ theme }) => theme.boxShadowBase};
    backdrop-filter: blur(20px);
    padding: 12px 24px;
`;

export const Content = styled.div`
    margin: 140px 20px 20px;
`;

export const ContentContainer = styled.div`
    margin: auto;
    max-width: 1000px;
    width: 100%;
`;
