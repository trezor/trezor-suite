import type { PublicClient } from 'viem';

import { getKnownTokens } from './knownTokens';

const clientOn = (chainId: number) =>
    ({ getChainId: () => Promise.resolve(chainId) }) as unknown as PublicClient;

describe(getKnownTokens.name, () => {
    it('balance-checks EURC, cirBTC and WETH on Arc mainnet', async () => {
        expect(await getKnownTokens(clientOn(5042))).toEqual([
            '0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1',
            '0x171A4217b86A807A64eB94757Db6849fb4bDbAA0',
            '0x128cC466B61f542da60c70e3aA11c10e19B84EDB',
        ]);
    });

    it('lists nothing for a chain without known tokens', async () => {
        expect(await getKnownTokens(clientOn(1))).toEqual([]);
    });
});
