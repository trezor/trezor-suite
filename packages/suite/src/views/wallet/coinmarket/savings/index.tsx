import React, { useContext } from 'react';
import { useSelector } from '@suite-hooks';
import { CoinmarketLayout, WalletLayout } from '@wallet-components';
import CoinmarketAuthentication, {
    CoinmarketAuthenticationContext,
} from '@wallet-components/CoinmarketAuthentication';
import type { AppState } from '@suite-types';
import { useCoinmarketNavigation } from '@suite/hooks/wallet/useCoinmarketNavigation';
import { useSavings } from '@wallet-hooks/coinmarket/savings/useSavings';
import UnsupportedCountry from './unsupported-country';
import UserInfo from './user-info';

interface CoinmarketSavingsLoadedProps {
    selectedAccount: Extract<AppState['wallet']['selectedAccount'], { status: 'loaded' }>;
}

const CoinmarketSavingsLoaded = ({ selectedAccount }: CoinmarketSavingsLoadedProps) => {
    const { whoAmI, fetching } = useContext(CoinmarketAuthenticationContext);
    const { navigateToSavingsLogin } = useCoinmarketNavigation(selectedAccount.account);
    const { isLoading, isClientFromUnsupportedCountry, savingsTrade } = useSavings();
    // TODO: rename fetching and isLoading...
    if (!fetching && whoAmI && !whoAmI.verified && !isLoading) {
        navigateToSavingsLogin();
    }
    return (
        <CoinmarketLayout>
            {whoAmI?.verified && !isLoading && (
                <>
                    Logged in user
                    <br />
                    <p>{whoAmI?.email ? whoAmI.email : 'Unknown user'}</p>
                    <p>User id: {whoAmI?.accountInfo ? whoAmI.accountInfo.id : 'Unknown user'}</p>
                    <hr />
                </>
            )}
            {isClientFromUnsupportedCountry && <UnsupportedCountry />}
            {savingsTrade?.status === 'Registration' && <UserInfo />}
        </CoinmarketLayout>
    );
};

const CoinmarketSavings = () => {
    const props = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
    }));

    const { selectedAccount } = props;
    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_SAVINGS" account={selectedAccount} />;
    }
    return (
        <CoinmarketAuthentication>
            <CoinmarketSavingsLoaded selectedAccount={selectedAccount} />
        </CoinmarketAuthentication>
    );
};

export default CoinmarketSavings;
