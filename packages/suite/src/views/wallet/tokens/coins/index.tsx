import { WalletLayout } from 'src/components/wallet';
import { useSelector } from 'src/hooks/suite';
import { TokensLayout } from '../common/TokensLayout/TokensLayout';
import { CoinsTable } from './components/CoinsTable';

export const Coins = () => {
    const { selectedAccount } = useSelector(state => state.wallet);

    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_TOKENS" account={selectedAccount} />;
    }

    return (
        <TokensLayout selectedAccount={selectedAccount}>
            <CoinsTable selectedAccount={selectedAccount} />
        </TokensLayout>
    );
};

export default Coins;
