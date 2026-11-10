import { useState } from 'react';

import { type CryptoId } from 'invity-api';

import { desktopQueryKeys, useQuery } from '@suite-common/react-query';
import { selectCoinDefinitions } from '@suite-common/token-definitions';
import { cryptoIdToNetworkAndContractAddress } from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';
import { getStellarInactiveTokens } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';

interface UseTradingStellarActivateTokenProps {
    account?: Account;
    receiveCryptoId?: CryptoId;
}

export const useTradingStellarActivateToken = ({
    account,
    receiveCryptoId,
}: UseTradingStellarActivateTokenProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const knownContracts = useSelector(state =>
        account ? selectCoinDefinitions(state, account.symbol)?.data : undefined,
    );

    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- cache identity is account.symbol + account.key + the number of known contracts; the queryFn passes the full account to getStellarInactiveTokens, but the extra fields aren't part of the key
    const { data: inactiveTokens, refetch } = useQuery({
        enabled: account?.symbol === 'xlm',
        queryKey: desktopQueryKeys.inactiveTokens(
            account?.symbol ?? 'xlm',
            account?.key,
            knownContracts?.length,
        ),
        queryFn: () => getStellarInactiveTokens(account!, knownContracts),
        initialData: [],
    });

    const { network: selectedAssetNetwork, contractAddress: selectedAssetContractAddress } =
        cryptoIdToNetworkAndContractAddress(receiveCryptoId);

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
