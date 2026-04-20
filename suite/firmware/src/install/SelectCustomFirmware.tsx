import { type Dispatch, type SetStateAction } from 'react';
import { useSelector } from 'react-redux';

import { type ExtendedMessageDescriptor, Translation } from '@suite/intl';
import { selectSelectedDevice } from '@suite-common/device';
import { BulletList, Button, Row } from '@trezor/components';
import { GITHUB_FW_BINARIES_URL } from '@trezor/urls';

import { DropZone } from './DropZone';
import { validateFirmware } from '../update/firmwareUtils';


type SelectCustomFirmwareProps = {
    setFirmwareBinary: Dispatch<SetStateAction<ArrayBuffer | undefined>>;
};

export const SelectCustomFirmware = ({ setFirmwareBinary }: SelectCustomFirmwareProps) => {
    const device = useSelector(selectSelectedDevice);

    const deviceModel = device?.features?.internal_model;
    const githubUrl = deviceModel
        ? `${GITHUB_FW_BINARIES_URL}/${deviceModel.toLowerCase()}`
        : GITHUB_FW_BINARIES_URL;

    const onFirmwareUpload = async (
        firmware: File,
        setError: (msg: ExtendedMessageDescriptor) => void,
    ) => {
        const fw = await firmware.arrayBuffer();
        const validationError = validateFirmware(fw, device);

        if (validationError) {
            setError({ id: validationError });
        } else {
            setFirmwareBinary(fw);
        }
    };

    return (
        <BulletList isOrdered>
            <BulletList.Item title={<Translation id="TR_CUSTOM_FIRMWARE_TITLE_DOWNLOAD" />}>
                <Row gap={6}>
                    <Translation id="TR_CUSTOM_FIRMWARE_GITHUB" />
                    <Button size="small" href={githubUrl} intent="neutral" priority="secondary">
                        github.com
                    </Button>
                </Row>
            </BulletList.Item>
            <BulletList.Item title={<Translation id="TR_CUSTOM_FIRMWARE_TITLE_UPLOAD" />}>
                <DropZone
                    data-testid="@firmware/input-area"
                    accept=".bin"
                    onSelect={onFirmwareUpload}
                />
            </BulletList.Item>
        </BulletList>
    );
};
