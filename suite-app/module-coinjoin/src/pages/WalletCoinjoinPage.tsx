import styled from 'styled-components';

import { selectFullSelectedAccount } from '@suite/account';
import { Translation } from '@suite/intl';
import { Column } from '@trezor/components';
import {
    CoinjoinAccountDiscoveryProgress,
    CoinjoinExplanation,
    CoinjoinSetup,
    CoinjoinSummary,
    WalletLayout,
    useSelector,
} from '@trezor/suite';
import { typography } from '@trezor/theme';

const Heading = styled.h3`
    color: ${({ theme }) => theme.contentSecondary};
    ${typography['body-sm-strong']}
    text-transform: uppercase;
`;

export const WalletCoinjoinPage = () => {
    const selectedAccount = useSelector(selectFullSelectedAccount);

    const { account } = selectedAccount;

    if (selectedAccount.status !== 'loaded' || account?.backendType !== 'coinjoin') {
        return <WalletLayout title="TR_ACCOUNT_TYPE_COINJOIN" account={selectedAccount} />;
    }

    const isSyncing = account.status === 'out-of-sync' && !!account.syncing;

    return (
        <WalletLayout title="TR_ACCOUNT_TYPE_COINJOIN" account={selectedAccount}>
            {isSyncing ? (
                <CoinjoinAccountDiscoveryProgress />
            ) : (
                <>
                    <CoinjoinSummary accountKey={account.key} />
                    <CoinjoinExplanation />
                    <Column gap={8}>
                        <Heading>
                            <Translation id="TR_COINJOIN_SETUP_HEADING" />
                        </Heading>
                        <CoinjoinSetup accountKey={account.key} />
                    </Column>
                </>
            )}
        </WalletLayout>
    );
};
