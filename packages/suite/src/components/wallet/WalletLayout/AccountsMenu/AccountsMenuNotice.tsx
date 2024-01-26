import { spacingsPx, typography } from '@trezor/theme';
import styled from 'styled-components';

export const AccountsMenuNotice = styled.div`
    display: flex;
    justify-content: center;
    text-align: center;
    margin-top: ${spacingsPx.xxl};
    margin-bottom: ${spacingsPx.md};
    color: ${({ theme }) => theme.textSubdued};
    ${typography.hint}
`;
