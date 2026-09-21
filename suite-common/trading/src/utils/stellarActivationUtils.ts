import type { CryptoId } from 'invity-api';

import type { Account, TokenAddress } from '@suite-common/wallet-types';

import { cryptoIdToNetworkAndContractAddress } from '../utils';

export type InactiveStellarReceiveToken = {
    contract: TokenAddress;
    symbol: string;
};

type GetInactiveStellarReceiveTokenParams = {
    account: Account | undefined;
    receiveCryptoId: CryptoId | undefined;
};

export const getInactiveStellarReceiveToken = ({
    account,
    receiveCryptoId,
}: GetInactiveStellarReceiveTokenParams): InactiveStellarReceiveToken | undefined => {
    if (account?.networkType !== 'stellar') {
        return undefined;
    }

    const { network, contractAddress } = cryptoIdToNetworkAndContractAddress(receiveCryptoId);

    if (!contractAddress || network?.networkType !== 'stellar') {
        return undefined;
    }

    if (account.tokens?.some(token => token.contract === contractAddress)) {
        return undefined;
    }

    return {
        contract: contractAddress,
        symbol: contractAddress.split('-')[0] ?? contractAddress,
    };
};
