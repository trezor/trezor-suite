import { type MouseEvent } from 'react';

import { selectIsDebugModeActive } from '@suite/debug';
import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import {
    getNetworkDisplaySymbol,
    getNetworkType,
    getWrappedNativeAddress,
    getWrappedNativeSymbol,
} from '@suite-common/wallet-config';
import { WETH_WRAP_GAS_RESERVE } from '@suite-common/wallet-constants';
import { Button } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { useDispatch, useSelector } from 'src/hooks/suite';
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

    // Keep a native buffer for the wrap fee (and any follow-up approve/deposit), matching the
    // reserve the shared wrap logic uses.
    const maxWrapAmount = BigNumber.max(
        0,
        new BigNumber(account.formattedBalance).minus(WETH_WRAP_GAS_RESERVE),
    ).toString();

    const onClick = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();

        dispatch(
            openModal({
                type: 'wrap-native-token',
                account,
                maxWrapAmount,
                nativeSymbol: getNetworkDisplaySymbol(symbol),
                wrappedSymbol,
            }),
        );
    };

    return (
        <Button
            intent="accentViolet"
            size="small"
            onClick={onClick}
            data-testid="@trading/menu/wrap-native-token"
        >
            <Translation id="TR_WRAP_NATIVE_TOKEN" />
        </Button>
    );
};
