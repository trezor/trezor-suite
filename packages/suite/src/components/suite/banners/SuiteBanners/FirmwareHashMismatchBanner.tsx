import { Translation } from 'src/components/suite';
import { Warning } from '@trezor/components';

export const FirmwareHashMismatch = () => (
    <Warning icon variant="destructive">
        <Translation id="TR_FIRMWARE_HASH_MISMATCH" />
    </Warning>
);
