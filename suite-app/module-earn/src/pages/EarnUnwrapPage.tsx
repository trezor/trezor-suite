import { useEffect, useMemo, useState } from 'react';

import { gotoThunk } from '@suite/router';
import { wrappedNativeToTokenMetadataSources } from '@suite-common/earn-stablecoin';
import { TokenMetadataProvider } from '@suite-common/token';
import { toTokenAddress } from '@suite-common/tokens';
import { useServices } from '@trezor/dependency-injection';
import { getWrappedNativeToken } from '@trezor/network-ethereum-suite-common';
import { injectDispatch } from '@trezor/redux-utils';
import {
    EarnLayoutFallback,
    UnwrapNativeToken,
    WrappedNativePageHeader,
    useEarnRouteAccount,
    useLayout,
} from '@trezor/suite';

export const EarnUnwrapPage = () => {
    const { dispatch } = useServices(injectDispatch);
    const { account, routeParams } = useEarnRouteAccount();
    const wrappedNative = account ? getWrappedNativeToken(account.symbol) : undefined;
    // Held here rather than in UnwrapNativeToken because useLayout renders the header outside it.
    const [isFlowComplete, setIsFlowComplete] = useState(false);
    const metadataSources = useMemo(
        () =>
            account && wrappedNative
                ? wrappedNativeToTokenMetadataSources(account.symbol, wrappedNative)
                : [],
        [account, wrappedNative],
    );

    useEffect(() => {
        if (!routeParams) {
            dispatch(gotoThunk({ routeName: 'suite-earn' }));
        }
    }, [dispatch, routeParams]);

    useLayout(
        'Earn',
        <WrappedNativePageHeader
            titleId="TR_UNWRAP_NATIVE_TOKEN"
            flow="unwrap"
            account={account}
            contractAddress={wrappedNative?.address}
            isFlowComplete={isFlowComplete}
        />,
    );

    if (!account) {
        return (
            <EarnLayoutFallback layoutState={{ status: 'invalid', reason: 'missing-account' }} />
        );
    }

    if (!wrappedNative) {
        return <EarnLayoutFallback layoutState={{ status: 'invalid', reason: 'token-mismatch' }} />;
    }

    const wrappedToken = account.tokens?.find(
        token => token.contract.toLowerCase() === wrappedNative.address.toLowerCase(),
    );

    return (
        <TokenMetadataProvider sources={metadataSources}>
            <UnwrapNativeToken
                account={account}
                token={{
                    networkSymbol: account.symbol,
                    contractAddress: toTokenAddress(wrappedNative.address),
                }}
                tokenBalance={wrappedToken?.balance ?? '0'}
                onFlowCompleteChange={setIsFlowComplete}
            />
        </TokenMetadataProvider>
    );
};
