import styled from 'styled-components';
import { IconButton } from '@trezor/components';
import { Account } from '@suite-common/wallet-types';
import { spacingsPx } from '@trezor/theme';
import { useDispatch } from 'src/hooks/suite';
import { AccountDetails } from './AccountDetails';
import { goto } from 'src/actions/suite/routerActions';
import { Route } from '@suite-common/suite-types';

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

    const handleBackClick = () => dispatch(goto(backRoute, { preserveParams: true }));

    return (
        <Container>
            <IconButton
                icon="ARROW_LEFT"
                variant="tertiary"
                size="medium"
                onClick={handleBackClick}
                data-test="@account-subpage/back"
            />
            <AccountDetails selectedAccount={selectedAccount} />
        </Container>
    );
};
