import { useEffect, useState } from 'react';

import { goto , selectRouteName } from '@suite/router';
import { hasNetworkFeatures } from '@suite-common/wallet-utils';
import { Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Route } from 'src/components/suite/Route';
import { StellarManageTokenModal } from 'src/components/suite/modals/ReduxModal/UserContextModal/StellarManageTokenModal';
import { StellarTokenInputModal } from 'src/components/suite/modals/ReduxModal/UserContextModal/StellarTokenInputModal';
import { WalletLayout } from 'src/components/wallet';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { TokensNavigation } from './TokensNavigation';
import { CoinsTable } from './coins/CoinsTable';
import { HiddenTokensTable } from './hidden-tokens/HiddenTokensTable';
import { InactiveTokensTable } from './inactive-tokens/InactiveTokensTable';

export const Tokens = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showManualInput, setShowManualInput] = useState(false);
    const [manualTokenContract, setManualTokenContract] = useState<string | null>(null);

    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const dispatch = useDispatch();
    const routeName = useSelector(selectRouteName);

    useEffect(() => {
        if (
            selectedAccount.status === 'loaded' &&
            !hasNetworkFeatures(selectedAccount.account, 'tokens') &&
            routeName !== 'wallet-index'
        ) {
            dispatch(goto({ routeName: 'wallet-index', preserveParams: true }));
        }
    }, [selectedAccount, dispatch, routeName]);

    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_TOKENS" account={selectedAccount} />;
    }

    const handleManualActivation = () => {
        setShowManualInput(true);
    };

    const handleManualTokenSubmit = (assetCode: string, assetIssuer: string) => {
        const contractAddress = `${assetCode}-${assetIssuer}`;
        setManualTokenContract(contractAddress);
        setShowManualInput(false);
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
            <Column gap={spacings.lg}>
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
