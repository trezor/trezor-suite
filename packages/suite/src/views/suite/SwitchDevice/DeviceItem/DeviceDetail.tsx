import { TruncateWithTooltip } from '@trezor/components';
import { spacingsPx, typography } from '@trezor/theme';
import { ReactNode } from 'react';
import styled from 'styled-components';

const Container = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    overflow: hidden;
    align-self: center;
`;

const DeviceLabel = styled(TruncateWithTooltip)`
    ${typography.body};
    margin-bottom: -${spacingsPx.xxs};
    min-width: 0;
    color: ${({ theme }) => theme.textDefault};
`;

export const DeviceDetail = ({ label, children }: { label: string; children: ReactNode }) => (
    <Container>
        <DeviceLabel>{label}</DeviceLabel>
        {children}
    </Container>
);
