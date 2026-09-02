import { type MouseEvent } from 'react';

import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { selectIsDebugModeActive } from '@suite/debug';
import { FirmwareUpgradeNeededModal } from '@suite/firmware-upgrade';
import { Translation, useTranslation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { selectSelectedDevice } from '@suite-common/device';
import { useDispatch } from '@suite-common/redux-utils';
import { getNetworkType } from '@suite-common/wallet-config';
import { isWrappedNativeFlowSupported } from '@suite-common/wallet-core';
import { Button, Tooltip } from '@trezor/components';
import {
    getWrappedNativeAddress,
    getWrappedNativeSymbol,
} from '@trezor/network-ethereum-suite-common';

import { useSelector } from 'src/hooks/suite';
import { useFirmwareUpgradeModal } from 'src/hooks/suite/useFirmwareUpgradeModal';
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
    const { translationString } = useTranslation();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const isDebugModeActive = useSelector(selectIsDebugModeActive);
    const device = useSelector(selectSelectedDevice);
    const isFirmwareOutdated = !isWrappedNativeFlowSupported(device);
    const { isFirmwareModalOpen, openFirmwareModal, closeFirmwareModal, updateFirmware } =
        useFirmwareUpgradeModal();
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

        if (isFirmwareOutdated) {
            openFirmwareModal();

            return;
        }

        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: 'continue',
                from: 'account-tradebox',
                to: 'wrap-form',
                networkSymbol: account.symbol,
            },
        });

        dispatch(
            gotoThunk({
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
        <>
            {isFirmwareModalOpen && (
                <FirmwareUpgradeNeededModal
                    onClose={closeFirmwareModal}
                    onUpdate={updateFirmware}
                    featureName={translationString('TR_EARN_DEFI_YIELD_TITLE')}
                />
            )}
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
        </>
    );
};
