import { useDispatch } from 'react-redux';

import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { IconButton } from '@trezor/components';
import { GearIcon } from '@trezor/icons';

export const NavSettings = () => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(goto({ routeName: 'settings-index' }));

    return (
        <IconButton
            icon={GearIcon}
            intent="neutral"
            priority="secondary"
            onClick={handleClick}
            data-testid="@suite/menu/settings"
            tooltip={{ content: <Translation id="TR_SETTINGS" /> }}
        />
    );
};
