import { H2, Column } from '@trezor/components';
import { SelectedAccountException } from '@suite-common/wallet-types';

import { AuthFailed } from './AuthFailed';
import { DiscoveryFailed } from './DiscoveryFailed';
import { DiscoveryEmpty } from './DiscoveryEmpty';
import { AccountNotEnabled } from './AccountNotEnabled';
import { AccountNotLoaded } from './AccountNotLoaded';
import { AccountNotExists } from './AccountNotExists';

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
        return <Column height="100%">{page}</Column>;
    }

    return (
        <Column height="100%">
            <H2 align="center">Exception {loader} not implemented</H2>
        </Column>
    );
};
