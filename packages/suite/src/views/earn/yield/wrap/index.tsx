import { useEffect } from 'react';

import { goto } from '@suite/router';
import { WRAPPED_NATIVE } from '@suite-common/wallet-config';

import { useEarnRouteAccount } from 'src/components/earn/utils/useEarnRouteAccount';
import { WrappedNativePageHeader } from 'src/components/earn/yield/common/WrappedNativePageHeader';
import { WrapNativeToken } from 'src/components/earn/yield/wrap/WrapNativeToken';
import { useDispatch, useLayout } from 'src/hooks/suite';

import { EarnLayoutFallback } from '../../EarnLayoutFallback';

export const EarnWrap = () => {
    const dispatch = useDispatch();
    const { account, routeParams } = useEarnRouteAccount();
    const wrappedNative = account ? WRAPPED_NATIVE[account.symbol] : undefined;

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

    return <WrapNativeToken account={account} token={token} />;
};
