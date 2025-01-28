import styled from 'styled-components';

import { Route } from '@suite-common/suite-types';
import { Account } from '@suite-common/wallet-types';
import { IconButton } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';

import { goto } from 'src/actions/suite/routerActions';
import { useDispatch } from 'src/hooks/suite';

import { AccountDetails } from './AccountDetails';

const Container = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.md};
`;

interface AccountSubpageNameProps {
    selectedAccount: Account;
    backRoute?: Route['name'];
}

export const AccountSubpageName = ({
    selectedAccount,
    backRoute = 'wallet-index',
}: AccountSubpageNameProps) => {
    const dispatch = useDispatch();

    const handleBackClick = () =>
        dispatch(
            goto(backRoute, {
                params: {
                    symbol: selectedAccount.symbol,
                    accountIndex: selectedAccount.index,
                    accountType: selectedAccount.accountType,
                },
            }),
        );

    return (
        <Container>
            <IconButton
                icon="caretLeft"
                variant="tertiary"
                size="medium"
                onClick={handleBackClick}
                data-testid="@account-subpage/back"
            />
            <AccountDetails selectedAccount={selectedAccount} isBalanceShown />
        </Container>
    );
};
