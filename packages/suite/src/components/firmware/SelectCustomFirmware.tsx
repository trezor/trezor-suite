import React, { useState } from 'react';
import styled from 'styled-components';
import { Button } from '@trezor/components';
import { GITHUB_FW_BINARIES_URL } from '@trezor/urls';
import { Translation, TrezorLink } from '@suite-components';
import { DropZone } from '@suite-components/DropZone';
import type { TrezorDevice, ExtendedMessageDescriptor } from '@suite-types';
import { validateFirmware } from '@firmware-utils';
import { InstructionStep } from '@suite-components/InstructionStep';

const Container = styled.div`
    width: 100%;
`;

const StyledLink = styled(TrezorLink)`
    margin-left: 6px;
`;

const StyledDropZone = styled(DropZone)`
    min-height: 110px;
`;

const InstallButton = styled(Button)`
    margin: 36px auto 0;
`;

type Props = {
    device?: TrezorDevice;
    onSuccess: (fw: ArrayBuffer) => void;
};

export const SelectCustomFirmware = ({ device, onSuccess }: Props) => {
    const [firmwareBinary, setFirmwareBinary] = useState<ArrayBuffer>();

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
        <Container>
            <InstructionStep
                number="1"
                title={<Translation id="TR_CUSTOM_FIRMWARE_TITLE_DOWNLOAD" />}
            >
                <Translation id="TR_CUSTOM_FIRMWARE_GITHUB" />
                <StyledLink variant="nostyle" href={GITHUB_FW_BINARIES_URL}>
                    <Button variant="tertiary" icon="EXTERNAL_LINK" alignIcon="right">
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

            <InstallButton
                variant="primary"
                isDisabled={!firmwareBinary}
                onClick={() => firmwareBinary && onSuccess(firmwareBinary)}
            >
                <Translation id="TR_CUSTOM_FIRMWARE_BUTTON_INSTALL" />
            </InstallButton>
        </Container>
    );
};
