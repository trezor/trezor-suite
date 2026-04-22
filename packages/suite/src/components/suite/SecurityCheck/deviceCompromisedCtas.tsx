import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { deviceActions } from '@suite-common/device';
import { Button } from '@trezor/components';
import {
    HELP_CENTER_ENTROPY_CHECK_URL,
    TREZOR_SUPPORT_DEVICE_AUTHENTICATION_FAILED_URL,
    TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_URL,
    type Url,
} from '@trezor/urls';

import { useDispatch } from 'src/hooks/suite';

type ContactSupportProps = {
    supportUrl: Url;
};
export const ContactSupport = ({ supportUrl }: ContactSupportProps) => {
    const chatUrl = `${supportUrl}#open-chat`;

    return (
        <Button href={chatUrl} flex="1" size="large">
            <Translation id="TR_CONTACT_TREZOR_SUPPORT" />
        </Button>
    );
};

export const EntropyCheckSupportButton = () => (
    <ContactSupport supportUrl={HELP_CENTER_ENTROPY_CHECK_URL} />
);

export const AuthenticateDeviceSupportButton = () => (
    <ContactSupport supportUrl={TREZOR_SUPPORT_DEVICE_AUTHENTICATION_FAILED_URL} />
);

export const FwAuthenticityCheckSupportButton = () => (
    <ContactSupport supportUrl={TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_URL} />
);

type DismissButtonProps = {
    onClick: () => void;
};
const DismissButton = ({ onClick }: DismissButtonProps) => (
    <Button
        intent="neutral"
        priority="secondary"
        onClick={onClick}
        size="large"
        data-testid="@device-compromised/dismiss-button"
    >
        <Translation id="TR_DISMISS" />
    </Button>
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
