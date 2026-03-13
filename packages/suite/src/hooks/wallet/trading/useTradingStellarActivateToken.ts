import { useState } from 'react';

import { type CryptoId } from 'invity-api';

import { desktopQueryKeys, useQuery } from '@suite-common/react-query';
import { cryptoIdToNetworkAndContractAddress } from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';

import { getInactiveStellarTokens } from 'src/views/wallet/tokens/inactive-tokens/InactiveTokensTable';

interface UseTradingStellarActivateTokenProps {
    account?: Account;
    receiveCryptoId?: CryptoId;
}

export const useTradingStellarActivateToken = ({
    account,
    receiveCryptoId,
}: UseTradingStellarActivateTokenProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: inactiveTokens, refetch } = useQuery({
        enabled: account?.symbol === 'xlm',
        queryKey: [desktopQueryKeys.inactiveTokens(account?.symbol ?? 'xlm', account?.key)],
        queryFn: () => getInactiveStellarTokens(account!),
        initialData: [],
    });

    const { contractAddress: selectedAssetContractAddress } =
        cryptoIdToNetworkAndContractAddress(receiveCryptoId);

    const inactiveToken = inactiveTokens?.find(
        token => token.contract === selectedAssetContractAddress,
    );

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
