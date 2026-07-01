import { type CryptoId } from 'invity-api';

import { getNetwork } from '@suite-common/wallet-config';

import { renderHookWithTradingStore } from '../../__tests__/testUtils';
import { useCryptoIdDecimals } from '../useCryptoIdDecimals';

describe('useCryptoIdDecimals', () => {
    it('returns native coin decimals from the network config', () => {
        const { result } = renderHookWithTradingStore(() =>
            useCryptoIdDecimals('ethereum' as CryptoId),
        );

        expect(result.current).toBe(getNetwork('eth').decimals);
    });

    it('treats an EVM native coin (zero contract address) as native', () => {
        const { result } = renderHookWithTradingStore(() =>
            useCryptoIdDecimals('base--0x0000000000000000000000000000000000000000' as CryptoId),
        );

        expect(result.current).toBe(getNetwork('base').decimals);
    });

    it('returns undefined for an undefined cryptoId', () => {
        const { result } = renderHookWithTradingStore(() => useCryptoIdDecimals(undefined));

        expect(result.current).toBeUndefined();
    });
});
