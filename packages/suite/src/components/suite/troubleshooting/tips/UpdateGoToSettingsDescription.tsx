import { Translation } from '@suite/intl';
import { goto } from '@suite/router';

import { TrezorLink } from 'src/components/suite/TrezorLink';
import { useDispatch } from 'src/hooks/suite';

export const UpdateGoToSettingsDescription = () => {
    const dispatch = useDispatch();

    const gotToDeviceSettings = () => dispatch(goto({ routeName: 'settings-device' }));

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
