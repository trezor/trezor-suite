import { type Dispatch, type ReactNode, type SetStateAction } from 'react';

import { useDevice } from '@suite/device';
import { validateFirmware } from '@suite/firmware-upgrade';
import { Translation } from '@suite/intl';
import { BulletList, Button, Row } from '@trezor/components';
import { DropZone } from '@trezor/product-components';
import { GITHUB_FW_BINARIES_URL } from '@trezor/urls';

type SelectCustomFirmwareProps = {
    setFirmwareBinary: Dispatch<SetStateAction<ArrayBuffer | undefined>>;
};

export const SelectCustomFirmware = ({ setFirmwareBinary }: SelectCustomFirmwareProps) => {
    const { device } = useDevice();

    const deviceModel = device?.features?.internal_model;
    const githubUrl = deviceModel
        ? `${GITHUB_FW_BINARIES_URL}/${deviceModel.toLowerCase()}`
        : GITHUB_FW_BINARIES_URL;

    const onFirmwareUpload = async (firmware: File, setError: (msg: ReactNode) => void) => {
        const fw = await firmware.arrayBuffer();
        const validationError = validateFirmware(fw, device);

        if (validationError) {
            setError(<Translation id={validationError} />);
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
                    emptyLabel={<Translation id="TR_DROPZONE" />}
                    emptyError={<Translation id="TR_DROPZONE_ERROR_EMPTY" />}
                    fileTypeError={<Translation id="TR_DROPZONE_ERROR_FILETYPE" />}
                    onSelect={onFirmwareUpload}
                />
            </BulletList.Item>
        </BulletList>
    );
};
