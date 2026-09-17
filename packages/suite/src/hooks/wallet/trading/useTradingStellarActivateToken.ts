import { useState } from 'react';

import { type CryptoId } from 'invity-api';

import { useStellarInactiveTokens } from '@suite-common/stellar-queries';
import { cryptoIdToNetworkAndContractAddress } from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';

interface UseTradingStellarActivateTokenProps {
    account?: Account;
    receiveCryptoId?: CryptoId;
}

export const useTradingStellarActivateToken = ({
    account,
    receiveCryptoId,
}: UseTradingStellarActivateTokenProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Activating a token adds its trustline to the account, and the list follows from that — there
    // is nothing to refetch once the modal closes.
    const { inactiveTokens } = useStellarInactiveTokens({ account });

    const { network: selectedAssetNetwork, contractAddress: selectedAssetContractAddress } =
        cryptoIdToNetworkAndContractAddress(receiveCryptoId);

    const inactiveToken =
        selectedAssetNetwork?.networkType === 'stellar'
            ? inactiveTokens.find(token => token.contract === selectedAssetContractAddress)
            : undefined;

    const onModalOpen = () => setIsModalOpen(true);

    const onModalClose = () => setIsModalOpen(false);

    return {
        inactiveToken,
        modal: {
            isOpen: isModalOpen,
            onOpen: onModalOpen,
            onClose: onModalClose,
        },
    };
};
