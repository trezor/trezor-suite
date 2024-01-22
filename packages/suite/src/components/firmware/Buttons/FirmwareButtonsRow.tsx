import styled from 'styled-components';

import { FirmwareCloseButton } from './FirmwareCloseButton';

const Row = styled.div`
    display: flex;
    gap: 20px;
`;

const StyledFirmwareCloseButton = styled(FirmwareCloseButton)`
    min-width: 180px;
`;

interface FirmwareButtonsRowProps {
    children: React.ReactNode;
    onClose?: () => void;
    withCancelButton?: boolean;
}

export const FirmwareButtonsRow = ({
    children,
    onClose,
    withCancelButton,
}: FirmwareButtonsRowProps) => (
    <Row>
        {withCancelButton && onClose && (
            <StyledFirmwareCloseButton variant="tertiary" onClick={onClose} />
        )}
        {children}
    </Row>
);
