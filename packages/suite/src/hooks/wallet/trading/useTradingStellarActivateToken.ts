import { useState } from 'react';

import { type CryptoId } from 'invity-api';

import { useServices } from '@suite-common/dependency-injection';
import { desktopQueryKeys, useQuery } from '@suite-common/react-query';
import { cryptoIdToNetworkAndContractAddress } from '@suite-common/trading';
import { selectNetworkConfigDeps } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { getStellarInactiveTokens } from '@suite-common/wallet-utils';

interface UseTradingStellarActivateTokenProps {
    account?: Account;
    receiveCryptoId?: CryptoId;
}

export const useTradingStellarActivateToken = ({
    account,
    receiveCryptoId,
}: UseTradingStellarActivateTokenProps) => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- cache identity is account.symbol + account.key; the queryFn passes the full account to getStellarInactiveTokens, but the extra fields aren't part of the key
    const { data: inactiveTokens, refetch } = useQuery({
        enabled: account?.symbol === 'xlm',
        queryKey: desktopQueryKeys.inactiveTokens(account?.symbol ?? 'xlm', account?.key),
        queryFn: () => getStellarInactiveTokens(account!),
        initialData: [],
    });

    const { network: selectedAssetNetwork, contractAddress: selectedAssetContractAddress } =
        cryptoIdToNetworkAndContractAddress(networkConfigDeps, receiveCryptoId);

    const inactiveToken =
        selectedAssetNetwork?.networkType === 'stellar'
            ? inactiveTokens?.find(token => token.contract === selectedAssetContractAddress)
            : undefined;

    const onModalOpen = () => setIsModalOpen(true);

    const onModalClose = () => {
        setIsModalOpen(false);
        refetch();
    };

    return {
        inactiveToken,
        modal: {
            isOpen: isModalOpen,
            onOpen: onModalOpen,
            onClose: onModalClose,
        },
    };
};
