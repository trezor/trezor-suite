import { useSelector } from 'react-redux';

import { selectGetNamedAddressSupportDep } from '@suite-common/address';
import { useServices } from '@suite-common/dependency-injection';
import {
    type AccountsRootState,
    type SendRootState,
    selectAccountNetworkSymbol,
    selectSendFormDraftOutputsByAccountKey,
} from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type AddressReviewEnsPreviewProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

/**
 * The send draft keeps the name the user typed on `address` and the onchain address it resolved to
 * on `resolvedAddress`. Both are shown here so the user can match the name they entered against the
 * address the device displays.
 */
export const AddressReviewEnsPreview = ({
    accountKey,
    tokenContract,
}: AddressReviewEnsPreviewProps) => {
    const { getNamedAddressSupport } = useServices(selectGetNamedAddressSupportDep);
    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const outputs = useSelector((state: SendRootState) =>
        selectSendFormDraftOutputsByAccountKey(state, accountKey, tokenContract),
    );

    const { address, resolvedAddress } = outputs?.[0] ?? {};
    const namedAddress = getNamedAddressSupport(symbol);

    if (!address || !resolvedAddress || !namedAddress.isNameLike(address)) return null;

    return (
        <VStack spacing="sp4">
            <Text variant="body-sm" color="contentSecondary">
                <Translation
                    id="moduleSend.review.address.ensSendingTo"
                    values={{ ensName: address }}
                />
            </Text>
            <Text variant="body-sm" color="contentSecondary">
                <Translation
                    id="moduleSend.review.address.ensWalletAddress"
                    values={{ address: resolvedAddress }}
                />
            </Text>
        </VStack>
    );
};
