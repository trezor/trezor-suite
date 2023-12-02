import { SolanaTxAdditionalInfo } from '../../types/api/solana';
import { validateParams } from '../common/paramsValidator';

const validateAdditionalInfo = (additionalInfo: SolanaTxAdditionalInfo) => {
    validateParams(additionalInfo, [{ name: 'tokenAccountsInfos', type: 'array' }]);

    additionalInfo.tokenAccountsInfos?.forEach(tokenAccountInfo => {
        validateParams(tokenAccountInfo, [
            { name: 'baseAddress', type: 'string' },
            { name: 'tokenProgram', type: 'string' },
            { name: 'tokenMint', type: 'string' },
            { name: 'tokenAccount', type: 'string' },
        ]);
    });
};

export const transformAdditionalInfo = (additionalInfo?: SolanaTxAdditionalInfo) => {
    if (!additionalInfo) {
        return undefined;
    }

    validateAdditionalInfo(additionalInfo);

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
