import { WalletLayout } from 'src/components/wallet';
import { isTestnet } from '@suite-common/wallet-utils';
import { useSelector } from 'src/hooks/suite';

import { NoTokens } from './components/NoTokens';
import { TokenList } from './components/TokenList';

export const Tokens = () => {
    const { selectedAccount } = useSelector(state => state.wallet);

    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_TOKENS" account={selectedAccount} />;
    }

    const { account, network } = selectedAccount;
    const explorerUrl =
        network.networkType === 'cardano' ? network.explorer.token : network.explorer.account;
    const explorerUrlQueryString = network.explorer.queryString;

    return (
        <WalletLayout title="TR_TOKENS" account={selectedAccount} showEmptyHeaderPlaceholder>
            <TokenList
                isTestnet={isTestnet(account.symbol)}
                explorerUrl={explorerUrl}
                explorerUrlQueryString={explorerUrlQueryString}
                tokens={account.tokens}
                networkType={account.networkType}
                networkSymbol={account.symbol}
            />
            {!account.tokens?.length && <NoTokens />}
        </WalletLayout>
    );
};

export default Tokens;
