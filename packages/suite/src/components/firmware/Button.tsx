import React from 'react';

import { Tooltip, Button } from '@trezor/components';
import { Translation } from '@suite-components';

interface RetryButtonProps {
    isDisabled: boolean;
    onClick: () => void;
}

export const RetryButton = ({ isDisabled, onClick }: RetryButtonProps) => (
    <Tooltip
        trigger={!isDisabled ? 'manual' : 'mouseenter focus'}
        placement="bottom"
        content={<Translation id="TR_CONNECT_YOUR_DEVICE" />}
    >
        <Button isDisabled={!isDisabled} onClick={onClick}>
            <Translation id="TR_RETRY" />
        </Button>
    </Tooltip>
);

interface ContinueButtonProps {
    onClick: () => void;
    isConnected: boolean;
    isInBootloader: boolean;
}

export const ContinueButton = ({ isConnected, isInBootloader, onClick }: ContinueButtonProps) => {
    let content;
    if (!isConnected) {
        content = <Translation id="TR_CONNECT_YOUR_DEVICE" />;
    } else if (isInBootloader) {
        content = <Translation id="TR_LEAVE_BOOTLOADER_MODE" />;
    } else {
        content = '';
    }
    return (
        <Tooltip
            trigger={isConnected && !isInBootloader ? 'manual' : 'mouseenter focus'}
            placement="bottom"
            content={content}
        >
            <Button
                data-test="@onboarding/button-continue"
                isDisabled={!isConnected || isInBootloader}
                onClick={() => onClick()}
            >
                <Translation id="TR_CONTINUE" />
            </Button>
        </Tooltip>
    );
};

interface InstallButtonProps {
    onClick: () => void;
    isConnected: boolean;
    isInBootloader: boolean;
    btcOnly: boolean;
}

export const InstallButton = ({
    isConnected,
    isInBootloader,
    btcOnly,
    onClick,
}: InstallButtonProps) => {
    let content;
    if (!isConnected) {
        content = <Translation id="TR_CONNECT_YOUR_DEVICE" />;
    } else if (!isInBootloader) {
        content = <Translation id="TR_RECONNECT_IN_BOOTLOADER" />;
    } else {
        content = '';
    }
    return (
        <Tooltip
            trigger={isConnected && isInBootloader ? 'manual' : 'mouseenter focus'}
            placement="bottom"
            content={content}
        >
            <Button isDisabled={!isConnected || !isInBootloader} onClick={() => onClick()}>
                {btcOnly && <Translation id="TR_INSTALL_BTC_ONLY" />}
                {!btcOnly && <Translation id="TR_INSTALL_FULL" />}
            </Button>
        </Tooltip>
    );
};
