import { TrezorLink } from '@suite/external-links';
import { gotoThunk } from '@suite/router';
import { Translation } from '@suite-lego/intl';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

export const UpdateGoToSettingsDescription = () => {
    const { dispatch } = useServices(injectDispatch);

    const gotToDeviceSettings = () => dispatch(gotoThunk({ routeName: 'settings-device' }));

    return (
        <Translation
            id="TR_WIPE_OR_UPDATE_DESCRIPTION"
            values={{
                a: chunks => (
                    <TrezorLink onClick={gotToDeviceSettings} data-testid="@goto/settings">
                        {chunks}
                    </TrezorLink>
                ),
            }}
        />
    );
};
