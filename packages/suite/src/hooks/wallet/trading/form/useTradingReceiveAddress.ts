import { useMemo } from 'react';

import { CryptoId } from 'invity-api';

import { cryptoIdToNetwork, getUnusedAddressFromAccount } from '@suite-common/trading';

import { useSelector } from 'src/hooks/suite';

import { useAccountAddressDictionary } from '../../useAccounts';

interface TradingReceiveAddressProps {
    cryptoId?: CryptoId;
}

interface TradingReceiveAddress {
    receiveAddress?: string;
}

export const useTradingReceiveAddress = ({
    cryptoId,
}: TradingReceiveAddressProps): TradingReceiveAddress => {
    const accounts = useSelector(state => state.wallet.accounts);

    const account = useMemo(() => {
        if (!cryptoId) return undefined;

        const network = cryptoIdToNetwork(cryptoId);

        return accounts.find(account => account.symbol === network?.symbol);
    }, [accounts, cryptoId]);

    const unusedAccountAddress = account && getUnusedAddressFromAccount(account);
    const addressDictionary = useAccountAddressDictionary(account);

    const accountAddress = unusedAccountAddress?.address
        ? addressDictionary[unusedAccountAddress?.address]
        : undefined;

    return { receiveAddress: accountAddress?.address };
};
