import { useEffect, useState } from 'react';

import { gotoThunk } from '@suite/router';
import { useServices } from '@trezor/dependency-injection';
import { getWrappedNativeToken } from '@trezor/network-ethereum-suite-common';
import { injectDispatch } from '@trezor/redux-utils';
import {
    EarnLayoutFallback,
    WrapNativeToken,
    WrappedNativePageHeader,
    useEarnRouteAccount,
    useLayout,
} from '@trezor/suite';

export const EarnWrapPage = () => {
    const { dispatch } = useServices(injectDispatch);
    const { account, routeParams } = useEarnRouteAccount();
    const wrappedNative = account ? getWrappedNativeToken(account.symbol) : undefined;
    // Held here rather than in WrapNativeToken because useLayout renders the header outside it.
    const [isFlowComplete, setIsFlowComplete] = useState(false);

    useEffect(() => {
        if (!routeParams) {
            dispatch(gotoThunk({ routeName: 'suite-earn' }));
        }
    }, [dispatch, routeParams]);

    useLayout(
        'Earn',
        <WrappedNativePageHeader
            titleId="TR_WRAP_NATIVE_TOKEN"
            flow="wrap"
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

    const token = {
        networkSymbol: account.symbol,
        symbol: wrappedNative.symbol,
        decimals: wrappedNative.decimals,
        contractAddress: wrappedNative.address,
    };

    return (
        <WrapNativeToken account={account} token={token} onFlowCompleteChange={setIsFlowComplete} />
    );
};
