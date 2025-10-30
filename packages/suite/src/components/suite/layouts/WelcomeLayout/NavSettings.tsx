import { NewIconButton, Tooltip } from '@trezor/components';

import { goto } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch } from 'src/hooks/suite';

export const NavSettings = () => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(goto('settings-index'));

    return (
        <Tooltip content={<Translation id="TR_SETTINGS" />}>
            <NewIconButton
                icon="gear"
                intent="neutral"
                priority="secondary"
                onClick={handleClick}
                data-testid="@suite/menu/settings"
            />
        </Tooltip>
    );
};
