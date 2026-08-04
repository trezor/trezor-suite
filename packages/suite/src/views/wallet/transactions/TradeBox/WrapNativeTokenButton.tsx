import { type MouseEvent } from 'react';

import { selectIsDebugModeActive } from '@suite/debug';
import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import {
    getNetworkType,
    getWrappedNativeAddress,
    getWrappedNativeSymbol,
} from '@suite-common/wallet-config';
import { Button, Tooltip } from '@trezor/components';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { useMessageSystemWrappedNative } from 'src/hooks/suite/useMessageSystemWrappedNative';
import { type Account } from 'src/types/wallet';

type WrapNativeTokenButtonProps = {
    account: Account;
};

/**
 * Debug-only action to wrap the native coin into its wrapped-native token (e.g. ETH → WETH).
 * Rendered in the account TradeBox; hidden outside debug mode, on non-EVM networks, or on networks
 * without a wrapped-native contract configured.
 */
export const WrapNativeTokenButton = ({ account }: WrapNativeTokenButtonProps) => {
    const dispatch = useDispatch();
    const isDebugModeActive = useSelector(selectIsDebugModeActive);
    const { isDisabled: isWrapDisabled, content: wrapDisabledContent } =
        useMessageSystemWrappedNative('wrap');

    const { symbol } = account;
    const wrappedAddress = getWrappedNativeAddress(symbol);
    const wrappedSymbol = getWrappedNativeSymbol(symbol);

    if (
        !isDebugModeActive ||
        getNetworkType(symbol) !== 'ethereum' ||
        !wrappedAddress ||
        !wrappedSymbol
    ) {
        return null;
    }

    const onClick = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();

        dispatch(
            goto({
                routeName: 'earn-yield-wrap',
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );
    };

    return (
        <Tooltip content={wrapDisabledContent} isActive={isWrapDisabled}>
            <Button
                intent="accentViolet"
                size="small"
                isDisabled={isWrapDisabled}
                onClick={onClick}
                data-testid="@trading/menu/wrap-native-token"
            >
                <Translation id="TR_WRAP_NATIVE_TOKEN" />
            </Button>
        </Tooltip>
    );
};
