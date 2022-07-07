import React from 'react';
import { Banner } from './Banner';
import { Translation } from '@suite-components';

const FirmwareHashMismatch = () => (
    <Banner variant="critical" body={<Translation id="TR_FIRMWARE_HASH_MISMATCH" />} />
);

export default FirmwareHashMismatch;
