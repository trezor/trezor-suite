import { useRef, useState } from 'react';

import { useDevice } from '@suite/device';
import { notificationsActions } from '@suite-common/toast-notifications';
import { Input } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { useDispatch } from 'src/hooks/suite';
import {
    type AuthLabelConnect,
    AuthLabelKeyType,
    LabelStore,
    isStaleStateError,
} from 'src/utils/authlabel/labelStore';

const asKeyBytes = (s: string) => new TextEncoder().encode(s);

// Proof-of-concept debug UI for authenticated labeling. Drives the three device
// calls via a per-render LabelStore. NOTE: for this to talk to the device the
// `messages_pb` MessageType registry must include the AuthLabel wire numbers,
// which is produced by `yarn workspace @trezor/protobuf update:protobuf
// <firmware-branch>` once the proto lands upstream. Until then the calls resolve
// with a "message not found" error — the trie/plumbing is otherwise complete.
export const AuthLabelDemo = () => {
    const { device, isLocked } = useDevice();
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const [store, setStore] = useState<LabelStore | null>(null);
    const keyRef = useRef<HTMLInputElement>(null);
    const labelRef = useRef<HTMLInputElement>(null);

    // adapt the typed TrezorConnect methods to the LabelStore's injected interface
    const connect: AuthLabelConnect = {
        authLabelGetState: params => TrezorConnect.authLabelGetState(params as any) as any,
        authLabelShow: params => TrezorConnect.authLabelShow(params as any) as any,
        authLabelChange: params => TrezorConnect.authLabelChange(params as any) as any,
    };

    const toast = (message: string, error = false) =>
        dispatch(
            notificationsActions.addToast(
                error
                    ? { type: 'error', error: message }
                    : { type: 'connect-popup-success', appName: message },
            ),
        );

    const run = async (fn: (s: LabelStore) => Promise<string>) => {
        setIsLoading(true);
        try {
            let s = store;
            if (!s) {
                s = new LabelStore(connect, device);
                await s.bootstrap();
                setStore(s);
            }
            try {
                toast(await fn(s));
            } catch (e) {
                if (!isStaleStateError(e)) throw e;
                // the device rejected our (root, counter): re-sync and try once more
                await s.bootstrap();
                toast(`${await fn(s)} (after re-sync)`);
            }
        } catch (e) {
            toast(e instanceof Error ? e.message : String(e), true);
        } finally {
            setIsLoading(false);
        }
    };

    const key = () => keyRef.current?.value ?? '';
    const label = () => labelRef.current?.value ?? '';

    return (
        <SectionItem>
            <TextColumn
                title="Authenticated labeling (PoC)"
                description="Set/show/delete a Trezor-authenticated label for an address key."
            />
            <ActionColumn>
                <Input innerRef={keyRef} placeholder="key (e.g. bc1q…)" />
                <Input innerRef={labelRef} placeholder="label (e.g. Alice)" />
                <ActionButton
                    size="small"
                    isDisabled={isLocked()}
                    isLoading={isLoading}
                    onClick={() =>
                        run(async s => {
                            await s.add(AuthLabelKeyType.ADDRESS, asKeyBytes(key()), label());

                            return `added "${label()}"`;
                        })
                    }
                >
                    Add
                </ActionButton>
                <ActionButton
                    size="small"
                    isDisabled={isLocked()}
                    isLoading={isLoading}
                    onClick={() =>
                        run(async s => {
                            const r = await s.show(AuthLabelKeyType.ADDRESS, asKeyBytes(key()));

                            return r.exists ? `label: ${r.label_value}` : 'no label';
                        })
                    }
                >
                    Show
                </ActionButton>
                <ActionButton
                    size="small"
                    isDisabled={isLocked()}
                    isLoading={isLoading}
                    onClick={() =>
                        run(async s => {
                            await s.delete(AuthLabelKeyType.ADDRESS, asKeyBytes(key()));

                            return 'deleted';
                        })
                    }
                >
                    Delete
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
