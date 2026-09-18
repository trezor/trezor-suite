import { asNetworkSymbol } from '@suite-common/wallet-config';

import { type CryptoAmountFormatterProps } from './CryptoAmountFormatter';

const networkAmount: CryptoAmountFormatterProps = {
    value: '1',
    symbol: asNetworkSymbol('btc'),
    valueUnit: 'main',
};

// @ts-expect-error Network amounts require a network symbol.
const networkAmountWithoutSymbol: CryptoAmountFormatterProps = {
    value: '1',
};

const networkAmountWithTokenMetadata: CryptoAmountFormatterProps = {
    value: '1',
    symbol: asNetworkSymbol('btc'),
    // @ts-expect-error Network amounts do not accept token metadata.
    token: {},
};

void networkAmount;
void networkAmountWithoutSymbol;
void networkAmountWithTokenMetadata;
