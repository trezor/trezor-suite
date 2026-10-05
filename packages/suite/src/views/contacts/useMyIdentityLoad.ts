import { useEffect, useRef, useState } from 'react';

import { type StaticSessionId } from '@trezor/connect';

import { loadIdentityThunk } from 'src/actions/suite/contactsThunks';
import { useDispatch } from 'src/hooks/suite';
import { type ContactsError } from 'src/utils/contacts/contactsErrors';

type UseMyIdentityLoadParams = {
    deviceState: StaticSessionId | undefined;
    identityNpub: string | undefined;
    isDeviceLocked: boolean;
};

// Kept with the wallet it belongs to, so that one wallet's error or loading state never shows
// under another wallet.
type IdentityLoadState = {
    deviceState: StaticSessionId;
    isLoading: boolean;
    error: ContactsError | null;
};

/**
 * Reads the selected wallet's contact identity from the device once per wallet, as soon as the
 * device is ready: reading needs no confirmation on the device, and the reducer keeps the identity
 * afterwards. `load` reads it on demand.
 */
export const useMyIdentityLoad = ({
    deviceState,
    identityNpub,
    isDeviceLocked,
}: UseMyIdentityLoadParams) => {
    const dispatch = useDispatch();
    const [loadState, setLoadState] = useState<IdentityLoadState | null>(null);
    // The card stays mounted across wallet switches, so the auto-load is tracked per wallet. A single
    // boolean would let only the first wallet load automatically.
    const autoLoadedWallets = useRef<Set<StaticSessionId>>(new Set());

    const load = async () => {
        if (!deviceState) return;

        const loadingDeviceState = deviceState;
        setLoadState({ deviceState: loadingDeviceState, isLoading: true, error: null });

        const result = await dispatch(loadIdentityThunk()).unwrap();
        const isWalletChanged = !result.success && result.error.code === 'wallet_changed';

        // The thunk records nothing once another wallet is selected, so the auto-load runs again
        // when this wallet is selected next. The refusal is no error of this wallet.
        if (isWalletChanged) {
            autoLoadedWallets.current.delete(loadingDeviceState);
        }

        // A load for another wallet may have started meanwhile; its state is left alone.
        setLoadState(previous =>
            previous?.deviceState === loadingDeviceState
                ? {
                      deviceState: loadingDeviceState,
                      isLoading: false,
                      error: result.success || isWalletChanged ? null : result.error,
                  }
                : previous,
        );
    };

    useEffect(() => {
        if (
            deviceState &&
            !identityNpub &&
            !isDeviceLocked &&
            !autoLoadedWallets.current.has(deviceState)
        ) {
            autoLoadedWallets.current.add(deviceState);
            load();
        }
        // `load` is left out because the per-wallet guard already makes the effect run it once per
        // wallet.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [identityNpub, deviceState, isDeviceLocked]);

    const currentLoadState = loadState?.deviceState === deviceState ? loadState : null;

    return {
        isLoading: currentLoadState?.isLoading ?? false,
        error: currentLoadState?.error ?? null,
        load,
    };
};
