import { mockResolvedYieldFlowData, mockYieldVault } from '@suite-common/wallet-core/mocks';

import { yieldFlowDataToTokenMetadataSources } from './yieldFlowDataToTokenMetadataSources';

const VAULT_TOKEN_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const RECEIPT_TOKEN_ADDRESS = '0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB';

describe('yieldFlowDataToTokenMetadataSources', () => {
    it('keys a token the account does not hold by its normalized and its vault address', () => {
        const defaults = mockResolvedYieldFlowData();
        const vault = mockYieldVault();
        const data = mockResolvedYieldFlowData({
            vault: {
                ...vault,
                token: { ...vault.token, address: VAULT_TOKEN_ADDRESS },
                outputToken: {
                    address: RECEIPT_TOKEN_ADDRESS,
                    symbol: 'trWETH',
                    name: 'Trezor Wrapped Ether',
                    decimals: 18,
                    network: 'ethereum',
                },
            },
            token: { ...defaults.token, contractAddress: VAULT_TOKEN_ADDRESS.toLowerCase() },
            receiptToken: {
                ...defaults.receiptToken,
                contractAddress: RECEIPT_TOKEN_ADDRESS.toLowerCase(),
            },
        });

        const [source] = yieldFlowDataToTokenMetadataSources(data);

        expect(source?.tokens.map(token => token.contract)).toEqual([
            VAULT_TOKEN_ADDRESS.toLowerCase(),
            VAULT_TOKEN_ADDRESS,
            RECEIPT_TOKEN_ADDRESS.toLowerCase(),
            RECEIPT_TOKEN_ADDRESS,
        ]);
        expect(source?.tokens[1]).toEqual({
            contract: VAULT_TOKEN_ADDRESS,
            name: vault.token.name,
            symbol: defaults.token.symbol,
            decimals: defaults.token.decimals,
        });
    });

    it('keys a token once when its resolved and vault addresses match', () => {
        const data = mockResolvedYieldFlowData();

        const [source] = yieldFlowDataToTokenMetadataSources(data);

        expect(source?.tokens.map(token => token.contract)).toEqual([
            data.token.contractAddress,
            data.receiptToken.contractAddress,
        ]);
    });
});
