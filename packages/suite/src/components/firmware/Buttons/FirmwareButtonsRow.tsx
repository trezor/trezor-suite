import styled from 'styled-components';

import { spacingsPx } from '@trezor/theme';
import { breakpointMediaQueries } from '@trezor/styles';

import { FirmwareCloseButton } from './FirmwareCloseButton';

const Row = styled.div`
    display: flex;
    gap: ${spacingsPx.lg};
    flex-flow: row wrap;

    ${breakpointMediaQueries.lg} {
        padding-bottom: ${spacingsPx.xxxl};
    }
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
