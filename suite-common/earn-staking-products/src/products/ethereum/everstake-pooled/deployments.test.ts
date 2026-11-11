import { asNetworkSymbol } from '@trezor/network-module-types';

import { getEverstakePoolDeployment } from './deployments';

describe('getEverstakePoolDeployment', () => {
    it.each([
        {
            symbol: 'eth',
            poolAddress: '0xD523794C879D9eC028960a231F866758e405bE34',
            minStakeAmount: '10000000000000000',
        },
        {
            symbol: 'thod',
            poolAddress: '0x7967AcFc9EB46cA2d20076B61B05e224F2d0B8b3',
            minStakeAmount: '100000000000000000',
        },
    ])(
        'knows the $symbol pool and its minimum stake',
        ({ symbol, poolAddress, minStakeAmount }) => {
            expect(getEverstakePoolDeployment(asNetworkSymbol(symbol))).toEqual({
                poolAddress,
                minStakeAmount,
            });
        },
    );

    it('refuses a network without an Everstake pool contract', () => {
        expect(() => getEverstakePoolDeployment(asNetworkSymbol('sol'))).toThrow(
            'Everstake has no pool contract on sol',
        );
    });
});
