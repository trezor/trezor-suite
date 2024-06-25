import { spacingsPx, typography } from '@trezor/theme';
import styled from 'styled-components';

export const PassphraseList = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.md};
    margin-bottom: ${spacingsPx.md};
    justify-items: center;
`;
export const PassphraseItem = styled.div`
    display: flex;
    ${typography.hint};
    gap: ${spacingsPx.md};
    align-items: center;
`;
