import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { goto } from '@suite/router';
import { getWrappedNativeToken, isWrappedNativeToken } from '@trezor/network-ethereum-suite-common';

import { useEarnRouteAccount } from 'src/components/earn/utils/useEarnRouteAccount';
import { WrappedNativePageHeader } from 'src/components/earn/yield/common/WrappedNativePageHeader';
import { UnwrapNativeToken } from 'src/components/earn/yield/unwrap/UnwrapNativeToken';
import { useLayout } from 'src/hooks/suite';

import { EarnLayoutFallback } from '../../EarnLayoutFallback';

export const EarnUnwrap = () => {
    const dispatch = useDispatch();
    const { account, routeParams } = useEarnRouteAccount();
    const wrappedNative = account ? getWrappedNativeToken(account.symbol) : undefined;
    // Held here rather than in UnwrapNativeToken because useLayout renders the header outside it.
    const [isFlowComplete, setIsFlowComplete] = useState(false);

    useEffect(() => {
        if (!routeParams) {
            dispatch(goto({ routeName: 'suite-earn' }));
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
