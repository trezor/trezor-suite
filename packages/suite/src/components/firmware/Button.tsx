import React from 'react';
import styled from 'styled-components';
import { Button, ButtonProps, Tooltip } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { useTranslation } from 'src/hooks/suite';

const StyledButton = styled(Button)`
    min-width: 180px;
`;

export const RetryButton = (props: Omit<ButtonProps, 'children'>) => (
    <Button {...props} data-test="@firmware/retry-button">
        <Translation id="TR_RETRY" />
    </Button>
);

export const ContinueButton = (props: Omit<ButtonProps, 'children'>) => (
    <StyledButton {...props} data-test="@firmware/continue-button">
        <Translation id="TR_CONTINUE" />
    </StyledButton>
);

const InstallButtonCommon = (
    props: Omit<ButtonProps, 'children'> & { children?: React.ReactNode },
) => (
    <StyledButton {...props} data-test="@firmware/install-button">
        {props.children || <Translation id="TR_INSTALL" />}
    </StyledButton>
);

interface InstallButtonProps extends Omit<ButtonProps, 'children'> {
    multipleDevicesConnected?: boolean;
    children?: React.ReactNode;
}

export const InstallButton = (props: InstallButtonProps) => {
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

export const CloseButton = (
    props: Omit<ButtonProps, 'children'> & { children?: React.ReactNode },
) => <Button {...props}>{props.children || <Translation id="TR_CLOSE" />}</Button>;
