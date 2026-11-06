import { useEffect, useState } from 'react';

import { gotoThunk } from '@suite/router';
import { useServices } from '@trezor/dependency-injection';
import { getWrappedNativeToken, isWrappedNativeToken } from '@trezor/network-ethereum-suite-common';
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

    const wrappedToken = account.tokens?.find(token =>
        isWrappedNativeToken(account.symbol, token.contract),
    );

    return (
        <UnwrapNativeToken
            account={account}
            tokenSymbol={wrappedNative.symbol}
            tokenDecimals={wrappedNative.decimals}
            tokenBalance={wrappedToken?.balance ?? '0'}
            tokenContractAddress={wrappedNative.address}
            onFlowCompleteChange={setIsFlowComplete}
        />
    );
};
