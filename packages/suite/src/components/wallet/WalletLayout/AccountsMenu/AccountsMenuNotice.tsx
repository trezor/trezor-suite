import styled from 'styled-components';

import { typography } from '@trezor/theme';

export const AccountsMenuNotice = styled.div`
    display: flex;
    justify-content: center;
    text-align: center;
    margin-top: 32px;
    margin-bottom: 16px;
    color: ${({ theme }) => theme.contentSecondary};
    ${typography['body-sm']}
`;
