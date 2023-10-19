import { useSelector } from 'src/hooks/suite/useSelector';

export const useExplorerTxUrl = () => {
    const network = useSelector(state => state.wallet.selectedAccount.network);

    return network?.networkType === 'cardano' ? network?.explorer.token : network?.explorer.address;
};
