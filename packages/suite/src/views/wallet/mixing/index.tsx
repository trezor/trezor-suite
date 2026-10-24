import { useEffect } from 'react';

import styled from 'styled-components';

import { selectFullSelectedAccount } from '@suite/account';
import { selectIsMixingEnabledByAccountKey } from '@suite/coinjoin';
import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { Column } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';
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

const Mixing = () => {
    const selectedAccount = useSelector(selectFullSelectedAccount);
    const isMixingEnabled = useSelector(state =>
        selectIsMixingEnabledByAccountKey(state, selectedAccount.account?.key ?? null),
    );

    const { dispatch } = useServices(injectDispatch);

    // Mixing is revealed only by a coordinator URL passed at startup, so the tab and its route
    // disappear on the next launch. Without the override the account has no mixing surface at all.
    useEffect(() => {
        if (selectedAccount.status === 'loaded' && !isMixingEnabled) {
            dispatch(gotoThunk({ routeName: 'wallet-index', preserveParams: true }));
        }
    }, [selectedAccount.status, isMixingEnabled, dispatch]);

    const { account } = selectedAccount;

    if (
        selectedAccount.status !== 'loaded' ||
        account?.backendType !== 'coinjoin' ||
        !isMixingEnabled
    ) {
        return <WalletLayout title="TR_NAV_MIXING" account={selectedAccount} />;
    }

    const isSyncing = account.status === 'out-of-sync' && !!account.syncing;

    return (
        <WalletLayout title="TR_NAV_MIXING" account={selectedAccount}>
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

export default Mixing;
