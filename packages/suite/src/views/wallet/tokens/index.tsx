import { useEffect, useState } from 'react';

import { selectFullSelectedAccount } from '@suite/account';
import { gotoThunk, selectRouteName } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';
import {
    DefinitionType,
    TokenManagementAction,
    tokenDefinitionsActions,
} from '@suite-common/token-definitions';
import {
    fetchAndUpdateAccountThunk,
    stellarContractTokensActions,
} from '@suite-common/wallet-core';
import { hasNetworkFeatures } from '@suite-common/wallet-utils';
import { Column } from '@trezor/components';

import { Route } from 'src/components/suite/Route';
import { StellarManageTokenModal } from 'src/components/suite/modals/ReduxModal/UserContextModal/StellarManageTokenModal';
import {
    type StellarTokenInput,
    StellarTokenInputModal,
} from 'src/components/suite/modals/ReduxModal/UserContextModal/StellarTokenInputModal';
import { WalletLayout } from 'src/components/wallet';
import { useSelector } from 'src/hooks/suite';

import { TokensNavigation } from './TokensNavigation';
import { CoinsTable } from './coins/CoinsTable';
import { DefiTokensTable } from './defi/DefiTokensTable';
import { HiddenTokensTable } from './hidden-tokens/HiddenTokensTable';
import { InactiveTokensTable } from './inactive-tokens/InactiveTokensTable';

export const Tokens = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showManualInput, setShowManualInput] = useState(false);
    const [manualTokenContract, setManualTokenContract] = useState<string | null>(null);

    const selectedAccount = useSelector(selectFullSelectedAccount);
    const { dispatch } = useServices(selectDispatch);
    const routeName = useSelector(selectRouteName);

    useEffect(() => {
        if (
            selectedAccount.status === 'loaded' &&
            !hasNetworkFeatures(selectedAccount.account, 'tokens') &&
            routeName !== 'wallet-index'
        ) {
            dispatch(gotoThunk({ routeName: 'wallet-index', preserveParams: true }));
        }
    }, [selectedAccount, dispatch, routeName]);

    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_TOKENS" account={selectedAccount} />;
    }

    const handleManualActivation = () => {
        setShowManualInput(true);
    };

    const handleManualTokenSubmit = (token: StellarTokenInput) => {
        setShowManualInput(false);

        if (token.standard === 'STELLAR-CONTRACT') {
            // No trustline to sign: the contract only joins the list the account reads.
            const { key: accountKey, symbol } = selectedAccount.account;
            dispatch(
                stellarContractTokensActions.addContractToken({
                    accountKey,
                    contract: token.contract,
                }),
            );
            // Absent from the coin definitions, it would otherwise be filed as unverified.
            dispatch(
                tokenDefinitionsActions.setTokenStatus({
                    symbol,
                    contractAddress: token.contract,
                    status: TokenManagementAction.SHOW,
                    type: DefinitionType.COIN,
                }),
            );
            dispatch(fetchAndUpdateAccountThunk({ accountKey }));

            return;
        }

        setManualTokenContract(`${token.assetCode}-${token.assetIssuer}`);
    };

    const closeManualInput = () => {
        setShowManualInput(false);
    };

    const closeManualActivateModal = () => {
        setManualTokenContract(null);
    };

    // Show manual activation button only on inactive tokens tab for Stellar network
    const showManualActivationButton =
        routeName === 'wallet-tokens-inactive' && selectedAccount.account.networkType === 'stellar';

    return (
        <WalletLayout title="TR_TOKENS" account={selectedAccount}>
            <Column gap={20}>
                <TokensNavigation
                    selectedAccount={selectedAccount}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onManualActivation={handleManualActivation}
                    showManualActivation={showManualActivationButton}
                />
                <Route name="wallet-tokens">
                    <CoinsTable selectedAccount={selectedAccount} searchQuery={searchQuery} />
                </Route>
                <Route name="wallet-tokens-hidden">
                    <HiddenTokensTable
                        selectedAccount={selectedAccount}
                        searchQuery={searchQuery}
                    />
                </Route>
                <Route name="wallet-tokens-inactive">
                    <InactiveTokensTable
                        selectedAccount={selectedAccount}
                        searchQuery={searchQuery}
                    />
                </Route>
                <Route name="wallet-tokens-defi">
                    <DefiTokensTable selectedAccount={selectedAccount} searchQuery={searchQuery} />
                </Route>
            </Column>

            {showManualInput && (
                <StellarTokenInputModal
                    onSubmit={handleManualTokenSubmit}
                    onCancel={closeManualInput}
                />
            )}

            {manualTokenContract && (
                <StellarManageTokenModal
                    mode="activate"
                    symbol={selectedAccount.account.symbol}
                    contractAddress={manualTokenContract}
                    onCancel={closeManualActivateModal}
                />
            )}
        </WalletLayout>
    );
};

export default Tokens;
