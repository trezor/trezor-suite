import { type ComponentPropsWithRef, type ComponentType } from 'react';

import styled from 'styled-components';

import { spacingsPx, typography } from '@trezor/theme';

export const AccountsMenuNotice: ComponentType<ComponentPropsWithRef<'div'>> = styled.div`
    display: flex;
    justify-content: center;
    text-align: center;
    margin-top: ${spacingsPx.xxl};
    margin-bottom: ${spacingsPx.md};
    color: ${({ theme }) => theme.contentSecondary};
    ${typography['body-sm']}
`;
