import { TrezorLink } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { useDispatch } from '@suite-common/redux-utils';

export const UpdateGoToSettingsDescription = () => {
    const dispatch = useDispatch();

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
