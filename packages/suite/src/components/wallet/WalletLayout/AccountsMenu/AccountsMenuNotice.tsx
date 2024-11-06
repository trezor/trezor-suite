import styled from 'styled-components';

import { spacingsPx, typography } from '@trezor/theme';

export const AccountsMenuNotice = styled.div`
    display: flex;
    justify-content: center;
    text-align: center;
    margin-top: ${spacingsPx.xxl};
    margin-bottom: ${spacingsPx.md};
    color: ${({ theme }) => theme.textSubdued};
    ${typography.hint}
`;
