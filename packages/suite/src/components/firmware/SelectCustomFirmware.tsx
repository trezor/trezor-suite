import React, { useState } from 'react';
import styled from 'styled-components';
import { Button, colors, variables, H3 } from '@trezor/components';
import { GITHUB_FW_BINARIES_URL } from '@trezor/urls';
import { Translation, TrezorLink } from '@suite-components';
import { DropZone } from '@suite-components/DropZone';
import type { TrezorDevice, ExtendedMessageDescriptor } from '@suite-types';
import { validateFirmware } from '@firmware-utils';

const StepContainer = styled.div`
    display: flex;
    align-self: start;
    &:not(:first-child) {
        margin-top: 60px;
    }
`;

const StepTitle = styled(H3)`
    line-height: 40px;
    text-align: left;
    color: ${props => props.theme.TYPE_DARK_GREY};
    flex-grow: 0;
    margin-bottom: 8px;
`;

const StepContent = styled.div`
    padding-left: 26px;
    width: 100%;
    text-align: left;
`;

const StepOrder = styled.div`
    font-size: ${variables.NEUE_FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    font-variant-numeric: tabular-nums;
    color: ${colors.TYPE_GREEN};
    border: solid 1px ${props => props.theme.STROKE_GREY};
    border-radius: 100%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
`;

const StyledDropZone = styled(DropZone)`
    min-height: 96px;
`;

const StyledInstallButton = styled(Button)`
    min-width: 232px;
`;

type StepProps = {
    order: string;
    title: React.ReactNode;
};

const Step: React.FC<StepProps> = ({ order, title, children }) => (
    <StepContainer>
        <StepOrder>{order}</StepOrder>
        <StepContent>
            <StepTitle>{title}</StepTitle>
            {children}
        </StepContent>
    </StepContainer>
);

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
        <>
            <Step order="1" title={<Translation id="TR_CUSTOM_FIRMWARE_TITLE_DOWNLOAD" />}>
                <TrezorLink variant="nostyle" href={GITHUB_FW_BINARIES_URL}>
                    <Button variant="tertiary" icon="EXTERNAL_LINK" alignIcon="right">
                        <Translation id="TR_CUSTOM_FIRMWARE_BUTTON_DOWNLOAD" />
                    </Button>
                </TrezorLink>
            </Step>
            <Step order="2" title={<Translation id="TR_CUSTOM_FIRMWARE_TITLE_UPLOAD" />}>
                <StyledDropZone accept=".bin" icon="BINARY" onSelect={onFirmwareUpload} />
            </Step>
            <Step order="3" title={<Translation id="TR_CUSTOM_FIRMWARE_TITLE_INSTALL" />}>
                <StyledInstallButton
                    variant="primary"
                    isDisabled={!firmwareBinary}
                    onClick={() => firmwareBinary && onSuccess(firmwareBinary)}
                >
                    <Translation id="TR_CUSTOM_FIRMWARE_BUTTON_INSTALL" />
                </StyledInstallButton>
            </Step>
        </>
    );
};
