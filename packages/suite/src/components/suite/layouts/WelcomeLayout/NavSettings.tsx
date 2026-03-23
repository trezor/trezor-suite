import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { IconButton, Tooltip } from '@trezor/components';

import { useDispatch } from 'src/hooks/suite';

export const NavSettings = () => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(goto({ routeName: 'settings-index' }));

    return (
        <Tooltip content={<Translation id="TR_SETTINGS" />}>
            <IconButton
                icon="gear"
                intent="neutral"
                priority="secondary"
                onClick={handleClick}
                data-testid="@suite/menu/settings"
            />
        </Tooltip>
    );
};
