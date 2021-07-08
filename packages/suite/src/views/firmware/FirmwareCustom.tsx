import React from 'react';
import styled from 'styled-components';
import { Button, colors } from '@trezor/components';
import { useActions } from '@suite-hooks';
import { Translation, Modal } from '@suite-components';
import { DropZone } from '@suite-components/DropZone';
import * as routerActions from '@suite-actions/routerActions';

const StepContainer = styled.div`
    display: flex;
    &:not(:first-child) {
        margin-top: 60px;
    }
`;

const StepTitle = styled.h2`
    font-weight: 500;
    font-size: 20px;
    line-height: 40px;
    text-align: left;
    color: ${colors.TYPE_DARK_GREY};
    flex-grow: 0;
    margin-bottom: 8px;
`;

const StepContent = styled.div`
    margin-left: 26px;
    & > .Firmware__InstallButton {
        min-width: 232px;
    }
    & > div {
        min-height: 96px;
    }
`;

const StepOrder = styled.div`
    font-size: 14px;
    font-weight: 600;
    color: ${colors.TYPE_GREEN};
    border: solid 1px ${colors.STROKE_GREY};
    border-radius: 100%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
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

const FirmwareCustom = () => {
    const { closeModalApp } = useActions({
        closeModalApp: routerActions.closeModalApp,
    });

    const onCancel = () => {
        closeModalApp();
    };

    return (
        <Modal
            cancelable
            onCancel={onCancel}
            heading={<Translation id="TR_DEVICE_SETTINGS_CUSTOM_FIRMWARE_TITLE" />}
            fixedWidth={['100vw', '90vw', '620px', '620px']}
            data-test="@firmware-custom"
        >
            <div>
                <Step order="1" title={<Translation id="TR_CUSTOM_FIRMWARE_TITLE_DOWNLOAD" />}>
                    <Button variant="tertiary" icon="EXTERNAL_LINK" alignIcon="right">
                        <Translation id="TR_CUSTOM_FIRMWARE_BUTTON_DOWNLOAD" />
                    </Button>
                </Step>
                <Step order="2" title={<Translation id="TR_CUSTOM_FIRMWARE_TITLE_UPLOAD" />}>
                    <DropZone accept="text/csv" onSuccess={() => {}} />
                </Step>
                <Step order="3" title={<Translation id="TR_CUSTOM_FIRMWARE_TITLE_INSTALL" />}>
                    <Button variant="primary" className="Firmware__InstallButton">
                        <Translation id="TR_CUSTOM_FIRMWARE_BUTTON_INSTALL" />
                    </Button>
                </Step>
            </div>
        </Modal>
    );
};

export default FirmwareCustom;
