import { type Address, type PublicKey } from '@trezor/connect';

import { CommonPopupFlow, type PopupFlowPayload, type PopupFlowResponse } from './CommonPopupFlow';
import { connectPopupActions } from '../connectPopupActions';
import { getPermissionDeferred } from '../connectPopupPromiseManager';

type AddressConfirmationMethod =
    | 'getAddress'
    | 'ethereumGetAddress'
    | 'cardanoGetAddress'
    | 'rippleGetAddress'
    | 'solanaGetAddress'
    | 'tezosGetAddress'
    | 'tronGetAddress'
    | 'stellarGetAddress'
    | 'moneroGetAddress'
    | 'getPublicKey'
    | 'ethereumGetPublicKey'
    | 'cardanoGetPublicKey'
    | 'solanaGetPublicKey'
    | 'tezosGetPublicKey';

/**
 * Exports addresses or public keys without showing them on the device, then lets the user verify
 * them one by one.
 */
export class AddressConfirmationFlow extends CommonPopupFlow<AddressConfirmationMethod> {
    protected preCall() {
        const bundle = this.getBundle();
        const payload = bundle
            ? { ...this.payload, bundle: bundle.map(item => ({ ...item, showOnTrezor: false })) }
            : { ...this.payload, showOnTrezor: false };

        // TS cannot match a spread of the payload union with its members.
        return payload as PopupFlowPayload<AddressConfirmationMethod>;
    }

    protected async postCall(response: PopupFlowResponse<AddressConfirmationMethod>) {
        if (!response.success) return false;

        const bundle = this.getBundle();
        const bundledResponse = (
            Array.isArray(response.payload) ? response.payload : [response.payload]
        ) as (Address | PublicKey)[];
        const addresses = bundledResponse.map((item, index) => ({
            // `displayablePublicKey` is the per-coin canonical user-facing
            // representation populated by `@trezor/connect` (xpubSegwit/xpub for
            // Bitcoin, base58 for Solana, hex for Tezos, etc.).
            address: 'address' in item ? item.address : item.displayablePublicKey,
            validated: 'not-started' as const,
            loading: false,
            validatePayload: bundle ? bundle[index] : this.payload,
        }));

        this.dispatch(connectPopupActions.confirmAddresses({ addresses, exported: false }));
        await getPermissionDeferred(true).promise;
        this.dispatch(connectPopupActions.confirmAddresses({ addresses, exported: true }));

        return true;
    }

    private getBundle() {
        return 'bundle' in this.payload && Array.isArray(this.payload.bundle)
            ? this.payload.bundle
            : undefined;
    }
}
