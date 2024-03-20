import { useState } from 'react';
import styled from 'styled-components';

import { selectDeviceModel } from '@suite-common/wallet-core';
import { Button } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import { GITHUB_FW_BINARIES_URL } from '@trezor/urls';

import { Translation, TrezorLink } from 'src/components/suite';
import { DropZone } from 'src/components/suite/DropZone';
import type { TrezorDevice, ExtendedMessageDescriptor } from 'src/types/suite';
import { validateFirmware } from 'src/utils/firmware';
import { InstructionStep } from 'src/components/suite/InstructionStep';
import { useSelector } from 'src/hooks/suite';

const Container = styled.div`
    width: 100%;
`;

const StyledLink = styled(TrezorLink)`
    margin-left: ${spacingsPx.xxs};
`;

const StyledDropZone = styled(DropZone)`
    min-height: 110px;
`;

const InstallButton = styled(Button)`
    margin: ${spacingsPx.xxl} auto 0;
`;

type SelectCustomFirmwareProps = {
    device?: TrezorDevice;
    onSuccess: (fw: ArrayBuffer) => void;
};

export const SelectCustomFirmware = ({ device, onSuccess }: SelectCustomFirmwareProps) => {
    const [firmwareBinary, setFirmwareBinary] = useState<ArrayBuffer>();
    const deviceModel = useSelector(selectDeviceModel);

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

    const install = () => {
        if (firmwareBinary) {
            onSuccess(firmwareBinary);
        }
    };

    return (
        <Container>
            <InstructionStep
                number="1"
                title={<Translation id="TR_CUSTOM_FIRMWARE_TITLE_DOWNLOAD" />}
            >
                <Translation id="TR_CUSTOM_FIRMWARE_GITHUB" />
                <StyledLink variant="nostyle" href={githubUrl}>
                    <Button
                        size="tiny"
                        variant="tertiary"
                        icon="EXTERNAL_LINK"
                        iconAlignment="right"
                    >
                        github.com
                    </Button>
                </StyledLink>
            </InstructionStep>

            <InstructionStep
                number="2"
                title={<Translation id="TR_CUSTOM_FIRMWARE_TITLE_UPLOAD" />}
            >
                <StyledDropZone accept=".bin" icon="BINARY" onSelect={onFirmwareUpload} />
            </InstructionStep>

            <InstallButton variant="primary" isDisabled={!firmwareBinary} onClick={install}>
                <Translation id="TR_CUSTOM_FIRMWARE_BUTTON_INSTALL" />
            </InstallButton>
        </Container>
    );
};
