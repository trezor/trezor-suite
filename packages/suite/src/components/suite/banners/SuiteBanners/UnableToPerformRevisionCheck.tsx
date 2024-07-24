import { Translation } from 'src/components/suite';
import { Banner } from '../Banner';

export const UnableToPerformRevisionCheck = () => (
    <Banner
        variant="destructive"
        body={<Translation id="TR_DEVICE_FIRMWARE_REVISION_CHECK_UNABLE_TO_PERFORM" />}
    />
);
