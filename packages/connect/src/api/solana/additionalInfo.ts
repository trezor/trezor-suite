import { Assert } from '@trezor/schema-utils';
import { SolanaTxAdditionalInfo } from '../../types/api/solana';

export const transformAdditionalInfo = (additionalInfo?: SolanaTxAdditionalInfo) => {
    if (!additionalInfo) {
        return undefined;
    }

    Assert(SolanaTxAdditionalInfo, additionalInfo);

    return {
        token_accounts_infos:
            additionalInfo.tokenAccountsInfos?.map(tokenAccountInfo => ({
                base_address: tokenAccountInfo.baseAddress,
                token_program: tokenAccountInfo.tokenProgram,
                token_mint: tokenAccountInfo.tokenMint,
                token_account: tokenAccountInfo.tokenAccount,
            })) || [],
    };
};
