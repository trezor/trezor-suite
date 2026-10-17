import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { deviceActions } from '@suite-common/device';
import { injectDispatch } from '@suite-common/redux-utils';
import { ejectAllWalletsThunk } from '@suite-common/wallet-core';
import {
    HELP_CENTER_ENTROPY_CHECK_URL,
    TREZOR_SUPPORT_DEVICE_AUTHENTICATION_FAILED_URL,
    TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_URL,
    type Url,
} from '@trezor/urls';

import { SecurityCheckButton } from './SecurityCheckButton';

type ContactSupportProps = {
    supportUrl: Url;
};
export const ContactSupport = ({ supportUrl }: ContactSupportProps) => {
    const chatUrl = `${supportUrl}#open-chat`;

    return (
        <SecurityCheckButton href={chatUrl}>
            <Translation id="TR_CONTACT_TREZOR_SUPPORT" />
        </SecurityCheckButton>
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
    <SecurityCheckButton
        intent="neutral"
        priority="secondary"
        onClick={onClick}
        data-testid="@device-compromised/dismiss-button"
    >
        <Translation id="TR_DISMISS" />
    </SecurityCheckButton>
);

export const DismissFwAuthenticityCheckButton = () => {
    const { device } = useDevice();
    const { dispatch } = useServices(injectDispatch);

    // device.id should always defined at this point, but if it weren't, fail-close by disabling dismissing.
    const deviceId = device?.id;
    if (typeof deviceId !== 'string') return null;

    const goToSuite = () => {
        dispatch(deviceActions.dismissFirmwareAuthenticityCheck(deviceId));
    };

    return <DismissButton onClick={goToSuite} />;
};

const DismissDiscoveryEntropyCheckButton = () => {
    const { device } = useDevice();
    const { dispatch } = useServices(injectDispatch);

    // device incl. its id should always defined at this point, but if it weren't, fail-close by disabling dismissing.
    const deviceId = device?.id;
    if (!device || typeof deviceId !== 'string') return null;

    const goToSuite = () => {
        dispatch(deviceActions.dismissDiscoveryEntropyCheck(deviceId));
        // The device returned a wrong xpub, so nothing it has ever returned can be trusted. See the thunk description.
        dispatch(ejectAllWalletsThunk({ device }));
    };

    return <DismissButton onClick={goToSuite} />;
};

export const DiscoveryEntropyCheckCtas = () => (
    <>
        <DismissDiscoveryEntropyCheckButton />
        <EntropyCheckSupportButton />
    </>
);

export const FwAuthenticityChecksCtas = () => (
    <>
        <DismissFwAuthenticityCheckButton />
        <FwAuthenticityCheckSupportButton />
    </>
);
