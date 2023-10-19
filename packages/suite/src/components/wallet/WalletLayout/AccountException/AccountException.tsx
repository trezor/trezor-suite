import styled from 'styled-components';
import { H2 } from '@trezor/components';
import { SelectedAccountException } from '@suite-common/wallet-types';

import { AuthFailed } from './AuthFailed';
import { DiscoveryFailed } from './DiscoveryFailed';
import { DiscoveryEmpty } from './DiscoveryEmpty';
import { AccountNotEnabled } from './AccountNotEnabled';
import { AccountNotLoaded } from './AccountNotLoaded';
import { AccountNotExists } from './AccountNotExists';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
`;

const Title = styled(H2)`
    display: flex;
    text-align: center;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
`;

const getExceptionPage = (
    loader: SelectedAccountException['loader'],
    network: SelectedAccountException['network'],
) => {
    switch (loader) {
        case 'auth-failed':
            return <AuthFailed />;
        case 'discovery-error':
            return <DiscoveryFailed />;
        case 'discovery-empty':
            return <DiscoveryEmpty />;
        case 'account-not-enabled':
            return <AccountNotEnabled network={network!} />;
        case 'account-not-loaded':
            return <AccountNotLoaded />;
        case 'account-not-exists':
            return <AccountNotExists />;
        // no default
    }
};

interface AccountExceptionProps {
    loader: SelectedAccountException['loader'];
    network: SelectedAccountException['network'];
}

export const AccountException = ({ loader, network }: AccountExceptionProps) => {
    const page = getExceptionPage(loader, network);

    if (page) {
        return <Wrapper>{page}</Wrapper>;
    }

    return (
        <Wrapper>
            <Title>Exception {loader} not implemented</Title>
        </Wrapper>
    );
};
