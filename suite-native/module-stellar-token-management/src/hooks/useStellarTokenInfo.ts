import { useStellarTokenInfo as useStellarTokenInfoQuery } from '@suite-common/stellar-queries';
import { type TokenAddress } from '@suite-common/wallet-types';

export const useStellarTokenInfo = (tokenContract: TokenAddress) => {
    const { data: tokenInfo, isLoading } = useStellarTokenInfoQuery(tokenContract);

    return { tokenInfo: tokenInfo ?? null, isLoading };
};
