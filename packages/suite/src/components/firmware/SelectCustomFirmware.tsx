import { Dispatch, SetStateAction } from 'react';

import { ExtendedMessageDescriptor } from '@suite-common/intl-types';
import { BulletList, Button } from '@trezor/components';
import { GITHUB_FW_BINARIES_URL } from '@trezor/urls';

import { Translation, TrezorLink } from 'src/components/suite';
import { DropZone } from 'src/components/suite/DropZone';
import { useDevice } from 'src/hooks/suite';
import { validateFirmware } from 'src/utils/firmware';

type SelectCustomFirmwareProps = {
    setFirmwareBinary: Dispatch<SetStateAction<ArrayBuffer | undefined>>;
};

export const SelectCustomFirmware = ({ setFirmwareBinary }: SelectCustomFirmwareProps) => {
    const { device } = useDevice();

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
                <Translation id="TR_CUSTOM_FIRMWARE_GITHUB" />{' '}
                <TrezorLink variant="nostyle" href={githubUrl}>
                    <Button size="tiny" variant="tertiary" icon="arrowUpRight" iconAlignment="end">
                        github.com
                    </Button>
                </TrezorLink>
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
