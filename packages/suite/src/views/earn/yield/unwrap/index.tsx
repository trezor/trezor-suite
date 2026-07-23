import { useEffect } from 'react';

import { goto } from '@suite/router';
import { WRAPPED_NATIVE } from '@suite-common/wallet-config';
import { isWrappedNativeToken } from '@suite-common/wallet-utils';

import { useEarnRouteAccount } from 'src/components/earn/utils/useEarnRouteAccount';
import { WrappedNativePageHeader } from 'src/components/earn/yield/common/WrappedNativePageHeader';
import { UnwrapNativeToken } from 'src/components/earn/yield/unwrap/UnwrapNativeToken';
import { useDispatch, useLayout } from 'src/hooks/suite';

import { EarnLayoutFallback } from '../../EarnLayoutFallback';

export const EarnUnwrap = () => {
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
            titleId="TR_UNWRAP_NATIVE_TOKEN"
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
        />
    );
};
