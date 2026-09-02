import { type ComponentType } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';

// Temporary type for FormattedCryptoAmount that is coupled in packages/suite
export type ReceiveAmountComponent = ComponentType<{ value: string; symbol: NetworkSymbol }>;
