import { spacingsPx, typography } from '@trezor/theme';
import styled from 'styled-components';

export const PassphraseList = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.sm};
    margin-top: ${spacingsPx.xs};
    margin-bottom: ${spacingsPx.md};
    justify-content: center;
`;
export const PassphraseItem = styled.div`
    display: flex;
    ${typography.hint};
    gap: ${spacingsPx.xs};
`;
