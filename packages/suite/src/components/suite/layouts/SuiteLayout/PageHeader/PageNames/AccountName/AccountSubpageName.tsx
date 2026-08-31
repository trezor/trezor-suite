import { useDispatch } from 'react-redux';

import { Translation } from '@suite/intl';
import { goto, selectSettingsBackRoute } from '@suite/router';
import { useSelector } from '@suite-common/redux-utils';
import { type Account } from '@suite-common/wallet-types';
import { IconButton, Row } from '@trezor/components';
import { CaretLeftIcon } from '@trezor/icons';

import { AccountDetails } from './AccountDetails';

interface AccountSubpageNameProps {
    selectedAccount: Account;
}

export const AccountSubpageName = ({ selectedAccount }: AccountSubpageNameProps) => {
    const dispatch = useDispatch();
    const previousRoute = useSelector(selectSettingsBackRoute);

    const handleBackClick = () =>
        dispatch(goto({ routeName: previousRoute.name, params: previousRoute.params }));

    return (
        <Row alignItems="center" gap={16}>
            <IconButton
                icon={CaretLeftIcon}
                intent="neutral"
                priority="secondary"
                size="large"
                onClick={handleBackClick}
                data-testid="@account-subpage/back"
                tooltip={{ content: <Translation id="TR_BACK" /> }}
            />
            <AccountDetails selectedAccount={selectedAccount} isBalanceShown />
        </Row>
    );
};
