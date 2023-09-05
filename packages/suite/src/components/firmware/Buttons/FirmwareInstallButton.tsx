import styled from 'styled-components';

import { Button, ButtonProps, Tooltip } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { useTranslation } from 'src/hooks/suite';

const StyledButton = styled(Button)`
    min-width: 180px;
`;

const InstallButtonCommon = (props: ButtonProps) => (
    <StyledButton {...props} data-test="@firmware/install-button">
        {props.children || <Translation id="TR_INSTALL" />}
    </StyledButton>
);

interface FirmwareInstallButtonProps extends ButtonProps {
    multipleDevicesConnected?: boolean;
}

export const FirmwareInstallButton = (props: FirmwareInstallButtonProps) => {
    const { translationString } = useTranslation();

    if (props.multipleDevicesConnected) {
        return (
            <Tooltip
                cursor="default"
                maxWidth={200}
                placement="bottom"
                interactive={false}
                hideOnClick={false}
                content={<div>{translationString('TR_INSTALL_FW_DISABLED_MULTIPLE_DEVICES')}</div>}
            >
                <InstallButtonCommon {...props} isDisabled />
            </Tooltip>
        );
    }

    return <InstallButtonCommon {...props} />;
};
