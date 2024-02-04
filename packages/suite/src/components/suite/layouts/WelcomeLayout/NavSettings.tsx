import { IconButton } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';

export const NavSettings = () => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(goto('settings-index'));

    return (
        <IconButton
            label={<Translation id="TR_SETTINGS" />}
            icon="SETTINGS"
            size="medium"
            variant="tertiary"
            onClick={handleClick}
            data-test="@suite/menu/settings"
        />
    );
};
