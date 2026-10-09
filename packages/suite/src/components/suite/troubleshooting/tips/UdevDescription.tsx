import { TrezorLink } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { injectDispatch } from '@suite-common/redux-utils';
import { useServices } from '@trezor/dependency-injection';

export const UdevDescription = () => {
    const { dispatch } = useServices(injectDispatch);

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
