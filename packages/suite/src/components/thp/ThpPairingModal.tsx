import { Box, Modal } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { ThpPairingPinEntry } from './ThpPairingPinEntry';
import { Translation } from '../suite/Translation';

interface ThpPairingModalModalProps {
    onCancel?: () => void;
}

export const ThpPairingModal = ({ onCancel }: ThpPairingModalModalProps) => (
    <Modal onCancel={onCancel} size="small" data-testid="@modal/thp-paring">
        <Box margin={{ bottom: spacings.xxxxl }}>
            <ThpPairingPinEntry heading={<Translation id="TR_THP_ENTER_ONE_TIME_CODE" />} />
        </Box>
    </Modal>
);
