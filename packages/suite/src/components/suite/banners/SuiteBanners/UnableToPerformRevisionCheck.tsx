import { Translation } from 'src/components/suite';
import { Warning } from '@trezor/components';

export const UnableToPerformRevisionCheck = () => (
    <Warning icon variant="destructive">
        <Translation id="TR_DEVICE_FIRMWARE_REVISION_CHECK_UNABLE_TO_PERFORM" />
    </Warning>
);
