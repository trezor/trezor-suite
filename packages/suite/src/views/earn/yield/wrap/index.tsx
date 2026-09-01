import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { goto } from '@suite/router';
import { getWrappedNativeToken } from '@trezor/network-ethereum-suite-common';

import { useEarnRouteAccount } from 'src/components/earn/utils/useEarnRouteAccount';
import { WrappedNativePageHeader } from 'src/components/earn/yield/common/WrappedNativePageHeader';
import { WrapNativeToken } from 'src/components/earn/yield/wrap/WrapNativeToken';
import { useLayout } from 'src/hooks/suite';

import { EarnLayoutFallback } from '../../EarnLayoutFallback';

export const EarnWrap = () => {
    const dispatch = useDispatch();
    const { account, routeParams } = useEarnRouteAccount();
    const wrappedNative = account ? getWrappedNativeToken(account.symbol) : undefined;
    // Held here rather than in WrapNativeToken because useLayout renders the header outside it.
    const [isFlowComplete, setIsFlowComplete] = useState(false);

    useEffect(() => {
        if (!routeParams) {
            dispatch(goto({ routeName: 'suite-earn' }));
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
