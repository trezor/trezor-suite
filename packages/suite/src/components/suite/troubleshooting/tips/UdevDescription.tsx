import { Translation } from '@suite/intl';
import { goto } from '@suite/router';

import { TrezorLink } from 'src/components/suite/TrezorLink';
import { useDispatch } from 'src/hooks/suite';

export const UdevDescription = () => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(goto({ routeName: 'suite-udev' }));

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
