import styled from 'styled-components';

import { Account } from '@suite-common/wallet-types';
import { IconButton } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';

import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { AccountDetails } from './AccountDetails';

const Container = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.md};
`;

interface AccountSubpageNameProps {
    selectedAccount: Account;
}

export const AccountSubpageName = ({ selectedAccount }: AccountSubpageNameProps) => {
    const dispatch = useDispatch();
    const previousRoute = useSelector(state => state.router.settingsBackRoute);

    const handleBackClick = () =>
        dispatch(goto(previousRoute.name, { params: previousRoute.params }));

    return (
        <Container>
            <IconButton
                icon="caretLeft"
                intent="neutral"
                priority="secondary"
                size="large"
                onClick={handleBackClick}
                data-testid="@account-subpage/back"
            />
            <AccountDetails selectedAccount={selectedAccount} isBalanceShown />
        </Container>
    );
};
