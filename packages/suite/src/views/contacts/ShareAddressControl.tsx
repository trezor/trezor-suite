import { useState } from 'react';

import { useDevice } from '@suite/device';
import { Translation, type TranslationKey } from '@suite/intl';
import { selectDeviceAccounts } from '@suite-common/wallet-core';
import { Badge, Button, Row, Tooltip } from '@trezor/components';
import { ShareNetworkIcon } from '@trezor/icons';

import { useSelector } from 'src/hooks/suite';
import { selectContactsWallet } from 'src/reducers/suite/contactsReducer';
import { accountSlip44, isContactsAccount } from 'src/utils/contacts/coin';
import {
    accountShareCapacity,
    outstandingSharedCountForPeer,
    selectReceiveFlowExclusions,
} from 'src/utils/contacts/sharing';

import { ShareAddressModal } from './ShareAddressModal';
import { useAddressExchangeBlockReason } from './useAddressExchangeBlockReason';

type ShareAddressControlProps = {
    /** The contact to give a fresh receive address to. */
    npub: string;
    /**
     * Set when answering a request for one coin: only accounts of that coin are offered, so the
     * contact gets the coin they asked for.
     */
    slip44?: number;
};

type GetTooltipIdParams = {
    exchangeBlockReasonId: TranslationKey | undefined;
    hasCapacity: boolean;
    isDeviceLocked: boolean;
};

// The tooltip also explains why the button is disabled, so it names the reason that applies.
const getTooltipId = ({
    exchangeBlockReasonId,
    hasCapacity,
    isDeviceLocked,
}: GetTooltipIdParams): TranslationKey => {
    if (exchangeBlockReasonId !== undefined) return exchangeBlockReasonId;

    // The gap limit blocks sharing even on an unlocked device, so it is named first.
    if (!hasCapacity) return 'TR_CONTACTS_SHARE_GAP_LIMIT';

    if (isDeviceLocked) return 'TR_CONTACTS_SHARE_LOCKED';

    return 'TR_CONTACTS_SHARE_ADDRESS_TOOLTIP';
};

/**
 * Opens the picker for sharing one of my addresses with a contact. Disabled when every eligible
 * account has used up its gap-limited window of fresh addresses, because an address beyond the gap
 * might not be found again on recovery.
 */
export const ShareAddressControl = ({ npub, slip44 }: ShareAddressControlProps) => {
    const { device, isLocked } = useDevice();
    const deviceState = device?.state?.staticSessionId;
    const deviceAccounts = useSelector(selectDeviceAccounts);
    const wallet = useSelector(state =>
        deviceState ? selectContactsWallet(state, deviceState) : undefined,
    );
    const exchangeBlockReasonId = useAddressExchangeBlockReason(npub);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const isDeviceLocked = isLocked();
    const shareableAccounts = deviceAccounts.filter(
        account =>
            isContactsAccount(account) &&
            (slip44 === undefined || accountSlip44(account) === slip44),
    );

    // Sharing reserves an address only for a while, so capacity and the count below depend on the
    // current time. Nothing is memoized on it, so reading it on every render is correct.
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    const hasCapacity = useSelector(state =>
        shareableAccounts.some(
            account =>
                accountShareCapacity({
                    account,
                    wallet: wallet ?? {},
                    now,
                    ...selectReceiveFlowExclusions(state, account),
                }) > 0,
        ),
    );

    if (shareableAccounts.length === 0) return null;

    // Counts the same reserved set that blocks re-sharing, so a share that expired drops out here
    // too.
    const sharedCount = outstandingSharedCountForPeer(wallet ?? {}, npub, now);

    const isDisabled = exchangeBlockReasonId !== undefined || !hasCapacity || isDeviceLocked;

    return (
        <Row gap={4} alignItems="center">
            {sharedCount > 0 && (
                <Tooltip content={<Translation id="TR_CONTACTS_SHARED_COUNT_TOOLTIP" />}>
                    <Badge size="small" intent="neutral">
                        {sharedCount}
                    </Badge>
                </Tooltip>
            )}
            <Tooltip
                content={
                    <Translation
                        id={getTooltipId({ exchangeBlockReasonId, hasCapacity, isDeviceLocked })}
                    />
                }
            >
                <Button
                    size="small"
                    intent="neutral"
                    priority="secondary"
                    iconLeft={ShareNetworkIcon}
                    onClick={() => setIsModalOpen(true)}
                    isDisabled={isDisabled}
                    data-testid={`@contacts/share/${npub}`}
                >
                    <Translation id="TR_CONTACTS_SHARE_ADDRESS" />
                </Button>
            </Tooltip>
            {isModalOpen && (
                <ShareAddressModal
                    npub={npub}
                    slip44={slip44}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </Row>
    );
};
