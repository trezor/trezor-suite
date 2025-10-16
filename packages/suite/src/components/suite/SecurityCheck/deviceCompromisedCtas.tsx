import { deviceActions } from '@suite-common/wallet-core';
import { NewButton } from '@trezor/components';
import {
    HELP_CENTER_ENTROPY_CHECK_URL,
    TREZOR_SUPPORT_DEVICE_AUTHENTICATION_FAILED_URL,
    TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_URL,
    Url,
} from '@trezor/urls';

import { Translation } from 'src/components/suite/Translation';

import { useDevice, useDispatch } from '../../../hooks/suite';

type ContactSupportProps = {
    supportUrl: Url;
};
export const ContactSupport = ({ supportUrl }: ContactSupportProps) => {
    const chatUrl = `${supportUrl}#open-chat`;

    return (
        <NewButton href={chatUrl} flex="1" size="large">
            <Translation id="TR_CONTACT_TREZOR_SUPPORT" />
        </NewButton>
    );
};

export const EntropyCheckSupportButton = () => (
    <ContactSupport supportUrl={HELP_CENTER_ENTROPY_CHECK_URL} />
);

export const AuthenticateDeviceSupportButton = () => (
    <ContactSupport supportUrl={TREZOR_SUPPORT_DEVICE_AUTHENTICATION_FAILED_URL} />
);

const FwAuthenticityCheckSupportButton = () => (
    <ContactSupport supportUrl={TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_URL} />
);

type DismissButtonProps = {
    onClick: () => void;
};
const DismissButton = ({ onClick }: DismissButtonProps) => (
    <NewButton
        intent="neutral"
        priority="secondary"
        onClick={onClick}
        size="large"
        data-testid="@device-compromised/dismiss-button"
    >
        <Translation id="TR_DISMISS" />
    </NewButton>
);

export const DismissFwAuthenticityCheckButton = () => {
    const { device } = useDevice();
    const dispatch = useDispatch();

    const goToSuite = () => {
        if (!device?.id) return; // device.id is always defined at this point
        dispatch(deviceActions.dismissFirmwareAuthenticityCheck(device.id));
    };

    return <DismissButton onClick={goToSuite} />;
};

export const FwAuthencityChecksCtas = () => (
    <>
        <DismissFwAuthenticityCheckButton />
        <FwAuthenticityCheckSupportButton />
    </>
);
