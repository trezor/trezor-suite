import { selectSettingsBackRoute } from '@suite/router';
import { Account } from '@suite-common/wallet-types';
import { IconButton, Row } from '@trezor/components';

import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { AccountDetails } from './AccountDetails';

interface AccountSubpageNameProps {
    selectedAccount: Account;
}

export const AccountSubpageName = ({ selectedAccount }: AccountSubpageNameProps) => {
    const dispatch = useDispatch();
    const previousRoute = useSelector(selectSettingsBackRoute);

    const handleBackClick = () =>
        dispatch(goto(previousRoute.name, { params: previousRoute.params }));

    return (
        <Row alignItems="center" gap={16}>
            <IconButton
                icon="caretLeft"
                intent="neutral"
                priority="secondary"
                size="large"
                onClick={handleBackClick}
                data-testid="@account-subpage/back"
            />
            <AccountDetails selectedAccount={selectedAccount} isBalanceShown />
        </Row>
    );
};
