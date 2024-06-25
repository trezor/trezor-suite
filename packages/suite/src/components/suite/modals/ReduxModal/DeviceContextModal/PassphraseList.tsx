import { spacingsPx, typography } from '@trezor/theme';
import styled from 'styled-components';

export const PassphraseList = styled.div<{ $gap?: 'small' | 'normal' }>`
    display: flex;
    flex-direction: column;
    gap: ${({ $gap }) => ($gap === 'small' ? spacingsPx.sm : spacingsPx.md)};
    margin-bottom: ${spacingsPx.md};
    justify-items: center;
`;
export const PassphraseItem = styled.div`
    display: flex;
    ${typography.hint};
    gap: ${spacingsPx.md};
    align-items: center;
`;
