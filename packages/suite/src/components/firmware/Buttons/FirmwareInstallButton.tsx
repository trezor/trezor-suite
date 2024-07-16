import { Button, ButtonProps, Tooltip } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { useTranslation } from 'src/hooks/suite';

const InstallButtonCommon = (
    props: Omit<ButtonProps, 'children'> & { children?: React.ReactNode },
) => (
    <Button {...props} data-test="@firmware/install-button">
        {props.children || <Translation id="TR_INSTALL" />}
    </Button>
);

interface FirmwareInstallButtonProps extends Omit<ButtonProps, 'children'> {
    multipleDevicesConnected?: boolean;
    children?: React.ReactNode;
}

export const FirmwareInstallButton = (props: FirmwareInstallButtonProps) => {
    const { translationString } = useTranslation();

    const { multipleDevicesConnected, ...rest } = props;

    if (multipleDevicesConnected) {
        return (
            <Tooltip
                cursor="default"
                maxWidth={200}
                placement="bottom"
                content={<div>{translationString('TR_INSTALL_FW_DISABLED_MULTIPLE_DEVICES')}</div>}
            >
                <InstallButtonCommon {...rest} isDisabled />
            </Tooltip>
        );
    }

    return <InstallButtonCommon {...rest} />;
};
