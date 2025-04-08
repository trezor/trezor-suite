import { IconButton } from '@trezor/components';

import { goto } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';

export const NavSettings = () => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(goto('settings-index'));

    return (
        <IconButton
            label={<Translation id="TR_SETTINGS" />}
            icon="gear"
            size="medium"
            variant="tertiary"
            onClick={handleClick}
            data-testid="@suite/menu/settings"
        />
    );
};
