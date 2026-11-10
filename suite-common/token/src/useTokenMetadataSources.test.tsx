/**
 * @jest-environment jsdom
 */
import { type PropsWithChildren } from 'react';

import { renderHook } from '@suite-common/test-utils';
import { toTokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { type TokenMetadataSource } from './TokenMetadataContext';
import { TokenMetadataProvider } from './TokenMetadataProvider';
import { useTokenMetadataSources } from './useTokenMetadataSources';

const parentToken = { contract: toTokenAddress('token'), symbol: 'PARENT' };
const parentSource: TokenMetadataSource = {
    networkSymbol: asNetworkSymbol('eth'),
    tokens: [parentToken],
};
const localSource: TokenMetadataSource = {
    ...parentSource,
    tokens: [{ ...parentToken, symbol: 'LOCAL' }],
};

const MetadataWrapper = ({ children }: PropsWithChildren) => (
    <TokenMetadataProvider sources={[parentSource]}>
        <TokenMetadataProvider sources={[localSource]}>{children}</TokenMetadataProvider>
    </TokenMetadataProvider>
);

describe('useTokenMetadataSources', () => {
    it('has no sources outside a provider', () => {
        const { result } = renderHook(useTokenMetadataSources);

        expect(result.current).toEqual([]);
    });

    it('captures local and inherited sources in precedence order for a portal', () => {
        const { result } = renderHook(useTokenMetadataSources, { wrapper: MetadataWrapper });

        expect(result.current).toEqual([localSource, parentSource]);
    });
});
