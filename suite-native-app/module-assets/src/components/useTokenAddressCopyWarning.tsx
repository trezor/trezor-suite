import { useAtom, useSetAtom, useStore } from 'jotai';

import { type AddressType } from '@suite-common/wallet-types';
import { useAlert } from '@suite-native/alerts';
import { Translation, type TxKeyPath } from '@suite-native/intl';

import { TokenAddressCopyWarningAppendix } from './TokenAddressCopyWarningAppendix';
import {
    hasTokenCopyWarningBeenDisabledAtom,
    isTokenCopyWarningOptOutCheckedAtom,
} from '../tokenAddressCopyWarningAtoms';

const descriptionByAddressType: Record<AddressType, TxKeyPath> = {
    contract:
        'moduleAssets.assetDetailScreen.settings.copyAddressWarningAlert.description.contract',
    fingerprint:
        'moduleAssets.assetDetailScreen.settings.copyAddressWarningAlert.description.fingerprint',
    policyId:
        'moduleAssets.assetDetailScreen.settings.copyAddressWarningAlert.description.policyId',
};

type ConfirmTokenAddressCopyParams = {
    addressType: AddressType;
    onConfirm: () => void;
};

export const useTokenAddressCopyWarning = () => {
    const [hasWarningBeenDisabled, setHasWarningBeenDisabled] = useAtom(
        hasTokenCopyWarningBeenDisabledAtom,
    );
    const setIsTokenCopyWarningOptOutChecked = useSetAtom(isTokenCopyWarningOptOutCheckedAtom);
    // The alert handlers are created when the alert opens, so a value from `useAtomValue` would be
    // stale by the time the user confirms. Reading from the store gives the value at press time.
    const { get: getJotaiState } = useStore();
    const { showAlert } = useAlert();

    const confirmTokenAddressCopy = ({ addressType, onConfirm }: ConfirmTokenAddressCopyParams) => {
        if (hasWarningBeenDisabled) {
            onConfirm();

            return;
        }

        setIsTokenCopyWarningOptOutChecked(false);

        showAlert({
            title: (
                <Translation id="moduleAssets.assetDetailScreen.settings.copyAddressWarningAlert.title" />
            ),
            description: <Translation id={descriptionByAddressType[addressType]} />,
            pictogramVariant: 'warning',
            appendix: <TokenAddressCopyWarningAppendix />,
            primaryButtonTitle: (
                <Translation id="moduleAssets.assetDetailScreen.settings.copyAddressWarningAlert.confirmButton" />
            ),
            primaryButtonColorProps: { intent: 'warning', priority: 'primary' },
            onPressPrimaryButton: () => {
                if (getJotaiState(isTokenCopyWarningOptOutCheckedAtom)) {
                    setHasWarningBeenDisabled(true);
                }

                onConfirm();
            },
            secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
            secondaryButtonColorProps: { intent: 'warning', priority: 'secondary' },
            testID: '@asset-detail/settings/copy-address-warning-alert',
        });
    };

    return confirmTokenAddressCopy;
};
