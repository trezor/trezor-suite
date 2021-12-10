import React, { useContext } from 'react';
import { useSelector } from '@suite-hooks';
import { CoinmarketLayout, WalletLayout } from '@wallet-components';
import CoinmarketAuthentication, {
    CoinmarketAuthenticationContext,
} from '@wallet-components/CoinmarketAuthentication';
import type { AppState } from '@suite-types';
import { useCoinmarketNavigation } from '@suite/hooks/wallet/useCoinmarketNavigation';

interface CoinmarketSavingsLoadedProps {
    selectedAccount: Extract<AppState['wallet']['selectedAccount'], { status: 'loaded' }>;
}

const CoinmarketSavingsLoaded = (props: CoinmarketSavingsLoadedProps) => {
    const { whoAmI, fetching } = useContext(CoinmarketAuthenticationContext);
    const { navigateToSavingsLogin } = useCoinmarketNavigation(props.selectedAccount.account);
    if (!fetching && whoAmI && !whoAmI.verified) {
        navigateToSavingsLogin();
    }
    return (
        <CoinmarketLayout>
            {whoAmI?.verified && (
                <>
                    Logged in user
                    <br />
                    <p>{whoAmI?.email ? whoAmI.email : 'Unknown user'}</p>
                    <p>User id: {whoAmI?.accountInfo ? whoAmI.accountInfo.id : 'Unknown user'}</p>
                </>
            )}
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
