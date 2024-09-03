import { Translation } from 'src/components/suite';
import { Banner } from '@trezor/components';

export const FirmwareHashMismatch = () => (
    <Banner icon variant="destructive">
        <Translation id="TR_FIRMWARE_HASH_MISMATCH" />
    </Banner>
);
