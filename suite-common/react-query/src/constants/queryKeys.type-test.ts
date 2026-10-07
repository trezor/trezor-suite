import { chainQueryKeys } from './queryKeys';

// A live object never belongs in a chain key: it would split one entry per render.
// @ts-expect-error object passed where a key part is expected
void chainQueryKeys.accountBalance('btc', 'blockbook', { descriptor: 'zpub' });

void chainQueryKeys.accountBalance('btc', 'blockbook', 'zpub');
