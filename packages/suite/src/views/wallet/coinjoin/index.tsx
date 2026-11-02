import styled from 'styled-components';

import { selectFullSelectedAccount } from '@suite/account';
import { Translation } from '@suite/intl';
import { Column } from '@trezor/components';
import { typography } from '@trezor/theme';

import { CoinjoinAccountDiscoveryProgress, WalletLayout } from 'src/components/wallet';
import { useSelector } from 'src/hooks/suite';

import { CoinjoinExplanation } from './CoinjoinExplanation/CoinjoinExplanation';
import { CoinjoinSetup } from './CoinjoinSetup/CoinjoinSetup';
import { CoinjoinSummary } from './CoinjoinSummary/CoinjoinSummary';

const Heading = styled.h3`
    color: ${({ theme }) => theme.contentSecondary};
    ${typography['body-sm-strong']}
    text-transform: uppercase;
`;

const Coinjoin = () => {
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

export default Coinjoin;
