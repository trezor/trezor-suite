import { Translation } from '@suite/intl';
import { IconButton, Tooltip } from '@trezor/components';

import { goto } from 'src/actions/suite/routerActions';
import { useDispatch } from 'src/hooks/suite';

export const NavSettings = () => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(goto('settings-index'));

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
