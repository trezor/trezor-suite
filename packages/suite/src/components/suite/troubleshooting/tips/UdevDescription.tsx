import { TrezorLink } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';

export const UdevDescription = () => {
    const { dispatch } = useServices(selectDispatch);

    const handleClick = () => dispatch(gotoThunk({ routeName: 'suite-udev' }));

    return (
        <div data-testid="@connect-device-prompt/unreadable-udev">
            <Translation
                id="TR_TROUBLESHOOTING_TIP_UDEV_INSTALL_DESCRIPTION"
                values={{
                    a: chunks => (
                        <TrezorLink onClick={handleClick} data-testid="@goto/udev">
                            {chunks}
                        </TrezorLink>
                    ),
                }}
            />
        </div>
    );
};
