import { NetworkSymbol } from '@suite-common/wallet-config';
import { useSelector } from 'src/hooks/suite/useSelector';

export const useExplorerTxUrl = (symbol: NetworkSymbol) => {
    const { address: explorerTxUrl, queryString: explorerUrlQueryString } = useSelector(
        state => state.wallet.blockchain[symbol].explorer,
    );

    return {
        explorerTxUrl,
        explorerUrlQueryString,
    };
};
