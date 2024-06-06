import { CryptoCategoriesProps } from 'src/types/coinmarket/coinmarket';

export const CryptoCategoryA = 'Popular currencies';
export const CryptoCategoryB = 'Ethereum ERC20 tokens';
export const CryptoCategoryC = 'Solana tokens';
export const CryptoCategoryD = 'Polygon ERC20 tokens';
export const CryptoCategoryE = 'Other currencies';

const CryptoCategories: CryptoCategoriesProps = {
    [CryptoCategoryA]: {
        translationId: 'TR_COINMARKET_CRYPTO_CATEGORY_A',
    },
    [CryptoCategoryB]: {
        translationId: 'TR_COINMARKET_CRYPTO_CATEGORY_B',
        network: 'eth',
    },
    [CryptoCategoryC]: {
        translationId: 'TR_COINMARKET_CRYPTO_CATEGORY_C',
        network: 'sol',
    },
    [CryptoCategoryD]: {
        translationId: 'TR_COINMARKET_CRYPTO_CATEGORY_D',
        network: 'matic',
    },
    [CryptoCategoryE]: {
        translationId: 'TR_COINMARKET_CRYPTO_CATEGORY_E',
    },
};

export default CryptoCategories;
