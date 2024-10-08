import { TranslationKey } from '@suite-common/intl-types';
import { isDeviceAcquired } from '@suite-common/suite-utils';
import { selectDevice } from '@suite-common/wallet-core';
import { Banner } from '@trezor/components';
import { FirmwareHashCheckError } from '@trezor/connect';
import { HELP_CENTER_FIRMWARE_REVISION_CHECK } from '@trezor/urls';

import { Translation, TrezorLink } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';

const messages: Record<
    Exclude<FirmwareHashCheckError, 'check-skipped'>,
    TranslationKey | string
> = {
    // TODO #14766 use actual translation ids, remove the `string` type and use it in the component
    'hash-mismatch': 'Compromised FW (hash mismatch)',
    'check-unsupported': 'Update STRONGLY recommended to get security...',
    'unknown-release': 'Compromised FW (unrecognized version)',
    'other-error': 'Compromised FW (unexpected device behavior)',
};

export const FirmwareHashCheckBanner = () => {
    const device = useSelector(selectDevice);

    if (
        !isDeviceAcquired(device) ||
        device.authenticityChecks?.firmwareHash?.success !== false ||
        device.authenticityChecks?.firmwareHash?.error === 'check-skipped'
    ) {
        return null;
    }

    return (
        <Banner
            icon
            variant="destructive"
            rightContent={
                <TrezorLink variant="nostyle" href={HELP_CENTER_FIRMWARE_REVISION_CHECK}>
                    <Banner.Button iconAlignment="right">
                        <Translation id="TR_LEARN_MORE" />
                    </Banner.Button>
                </TrezorLink>
            }
        >
            {/*TODO #14766 see above*/}
            {messages[device.authenticityChecks.firmwareHash.error]}
            {/*<Translation id={messages[device.authenticityChecks.firmwareHash.error]} />*/}
        </Banner>
    );
};
