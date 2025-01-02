import { spacings } from '@trezor/theme';
import { Row } from '@trezor/components';

import { FirmwareCloseButton } from './FirmwareCloseButton';

type FirmwareButtonsRowProps = {
    children: React.ReactNode;
    onClose?: () => void;
    withCancelButton?: boolean;
};

export const FirmwareButtonsRow = ({
    children,
    onClose,
    withCancelButton,
}: FirmwareButtonsRowProps) => (
    <Row flexWrap="wrap" gap={spacings.xs}>
        {children}
        {withCancelButton && onClose && (
            <FirmwareCloseButton variant="tertiary" onClick={onClose} minWidth={150} />
        )}
    </Row>
);
