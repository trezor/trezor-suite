import { useDispatch } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { CloseButton } from 'src/components/suite';

export const AccountFormCloseButton = () => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(goto('wallet-index', { preserveParams: true }));

    return <CloseButton onClick={handleClick} data-test-id="@wallet/menu/close-button" />;
};
