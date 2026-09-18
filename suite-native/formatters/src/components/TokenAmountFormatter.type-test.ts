import { asNetworkSymbol } from '@suite-common/wallet-config';
import { toTokenSymbol } from '@suite-common/wallet-types';

import { type TokenAmountFormatterProps } from './TokenAmountFormatter';
import { asDecimalTokenAmount } from '../utils';

const tokenAmount: TokenAmountFormatterProps = {
    value: asDecimalTokenAmount('1'),
    symbol: toTokenSymbol('USDC'),
    decimals: 6,
};

const tokenAmountWithoutKnownSymbol: TokenAmountFormatterProps = {
    value: asDecimalTokenAmount('1'),
};

const tokenAmountWithUnmarkedValue: TokenAmountFormatterProps = {
    // @ts-expect-error Token values must be explicitly marked as decimal token amounts.
    value: '1',
    symbol: toTokenSymbol('USDC'),
};

const tokenAmountWithNetworkSymbol: TokenAmountFormatterProps = {
    value: asDecimalTokenAmount('1'),
    // @ts-expect-error Token amounts do not accept network symbols.
    symbol: asNetworkSymbol('eth'),
};

const tokenAmountWithValueUnit: TokenAmountFormatterProps = {
    value: asDecimalTokenAmount('1'),
    // @ts-expect-error Value units only apply to network amounts.
    valueUnit: 'smallest',
};

void tokenAmount;
void tokenAmountWithoutKnownSymbol;
void tokenAmountWithUnmarkedValue;
void tokenAmountWithNetworkSymbol;
void tokenAmountWithValueUnit;
