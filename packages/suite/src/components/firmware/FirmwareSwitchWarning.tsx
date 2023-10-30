import styled from 'styled-components';

import { Image, variables } from '@trezor/components';

const Row = styled.div`
    display: flex;
    align-items: center;
    gap: 20px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const StyledImage = styled(Image)`
    width: 48px;
`;

interface FirmwareSwitchWarningProps {
    children: React.ReactNode;
    className?: string;
}

export const FirmwareSwitchWarning = ({ children, className }: FirmwareSwitchWarningProps) => (
    <Row className={className}>
        <StyledImage image="UNI_ERROR" />
        {children}
    </Row>
);
