import { useSelector } from 'src/hooks/suite/useSelector';

export const useExplorerTxUrlSuffix = () => {
    const network = useSelector(state => state.wallet.selectedAccount.network);

    return network?.symbol === 'dsol' ? '?cluster=devnet' : undefined;
};
