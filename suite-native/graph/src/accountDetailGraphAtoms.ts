import { type FiatGraphPointWithCryptoBalance } from '@suite-common/graph';

import { createGraphAtoms } from './createGraphAtoms';

export const accountDetailGraphAtoms = createGraphAtoms<FiatGraphPointWithCryptoBalance>();
