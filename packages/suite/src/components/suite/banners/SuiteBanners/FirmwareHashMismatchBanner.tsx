import { Banner } from '../Banner';
import { Translation } from 'src/components/suite';

export const FirmwareHashMismatch = () => (
    <Banner variant="critical" body={<Translation id="TR_FIRMWARE_HASH_MISMATCH" />} />
);
