import { useSelector } from '@suite-hooks/useSelector';

export const useExplorerTxUrl = () => {
    const network = useSelector(state => state.wallet.selectedAccount.network);

    return network?.networkType === 'cardano' ? network?.explorer.token : network?.explorer.address;
};
