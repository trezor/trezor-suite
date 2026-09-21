import { useState } from 'react';

import { type CryptoId } from 'invity-api';

import { getInactiveStellarReceiveToken } from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';

type UseTradingStellarActivateTokenParams = {
    account?: Account;
    receiveCryptoId?: CryptoId;
};

export const useTradingStellarActivateToken = ({
    account,
    receiveCryptoId,
}: UseTradingStellarActivateTokenParams) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const inactiveToken = getInactiveStellarReceiveToken({ account, receiveCryptoId });

    return {
        inactiveToken,
        modal: {
            isOpen: isModalOpen,
            onOpen: () => setIsModalOpen(true),
            onClose: () => setIsModalOpen(false),
        },
    };
};
