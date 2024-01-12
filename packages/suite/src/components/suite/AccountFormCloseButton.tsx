import { useDispatch } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { IconButton } from '@trezor/components';

export const AccountFormCloseButton = () => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(goto('wallet-index', { preserveParams: true }));

    return (
        <IconButton
            size="medium"
            icon="ARROW_LEFT"
            onClick={handleClick}
            data-test="@wallet/menu/close-button"
            variant="tertiary"
        />
    );
};
