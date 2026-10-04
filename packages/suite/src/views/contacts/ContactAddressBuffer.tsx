import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { selectDeviceAccounts } from '@suite-common/wallet-core';
import { Badge, Button, Column, Divider, Row, Text, Tooltip } from '@trezor/components';
import { ArrowsClockwiseIcon } from '@trezor/icons';

import { requestAddressFromContactThunk } from 'src/actions/suite/contactsThunks';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectContactsWallet } from 'src/reducers/suite/contactsReducer';
import {
    type AddressEntry,
    inboundAddressEntries,
    outboundAddressEntries,
    sortAddressEntries,
} from 'src/utils/contacts/addressBuffer';
import { accountSlip44, isContactsAccount, networkNameForSlip44 } from 'src/utils/contacts/coin';
import { shortenNpub } from 'src/utils/contacts/npub';

import { CopyIconButton } from './CopyIconButton';
import { useAddressExchangeBlockReason } from './useAddressExchangeBlockReason';

// The addresses exchanged with one contact, in two groups: theirs that I can pay to, and mine that
// I shared with them. Mainnet and testnet addresses can both be present, so every row names its
// network and the request button is per coin; a request tells the contact which coin to send.

// How long a sent request disables its button. The reply arrives whenever the contact's Suite
// answers, so after this the user may ask again.
const REQUEST_ACK_MS = 5000;

type AddressListProps = {
    titleId: 'TR_CONTACTS_BUFFER_THEIR_ADDRESSES' | 'TR_CONTACTS_BUFFER_MY_SHARED_ADDRESSES';
    emptyId: 'TR_CONTACTS_BUFFER_THEIR_EMPTY' | 'TR_CONTACTS_BUFFER_MINE_EMPTY';
    entries: AddressEntry[];
    getNetworkName: (slip44: number) => string | undefined;
    action?: ReactNode;
};

const AddressList = ({ titleId, emptyId, entries, getNetworkName, action }: AddressListProps) => (
    <Column gap={8}>
        <Row gap={8} alignItems="center" justifyContent="space-between">
            <Text typographyStyle="body-sm-strong">
                <Translation id={titleId} />
            </Text>
            {action}
        </Row>
        {entries.length === 0 ? (
            <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
                <Translation id={emptyId} />
            </Text>
        ) : (
            <Column gap={4}>
                {sortAddressEntries(entries).map(entry => {
                    const networkName = getNetworkName(entry.slip44);

                    return (
                        <Row key={entry.address} gap={8} alignItems="center">
                            <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
                                {shortenNpub(entry.address, 12)}
                            </Text>
                            <CopyIconButton value={entry.address} />
                            {networkName !== undefined && (
                                <Text
                                    typographyStyle="body-xs"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    {networkName}
                                </Text>
                            )}
                            {entry.isUsed ? (
                                <Badge size="small" intent="neutral">
                                    <Translation id="TR_CONTACTS_BUFFER_USED" />
                                </Badge>
                            ) : (
                                <Badge size="small" intent="brand">
                                    <Translation id="TR_CONTACTS_BUFFER_AVAILABLE" />
                                </Badge>
                            )}
                        </Row>
                    );
                })}
            </Column>
        )}
    </Column>
);

type ContactAddressBufferProps = {
    npub: string;
};

export const ContactAddressBuffer = ({ npub }: ContactAddressBufferProps) => {
    const dispatch = useDispatch();
    const { device } = useDevice();
    const deviceState = device?.state?.staticSessionId;
    const deviceAccounts = useSelector(selectDeviceAccounts);
    // The wallet object changes only with contacts state, so the row lists below are memoized on
    // it. Building them inside useSelector would return new arrays and re-render on every dispatch.
    const wallet = useSelector(state =>
        deviceState ? selectContactsWallet(state, deviceState) : undefined,
    );
    const exchangeBlockReasonId = useAddressExchangeBlockReason(npub);
    // Coin types with a request in flight, so their button shows a short acknowledgement.
    const [requestedSlip44s, setRequestedSlip44s] = useState<number[]>([]);
    // Each acknowledgement timer calls setState, so the timers are cancelled on unmount.
    const ackTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

    useEffect(
        () => () => {
            ackTimersRef.current.forEach(clearTimeout);
            ackTimersRef.current = [];
        },
        [],
    );

    // Networks the user holds an account of, one entry per coin type.
    const requestableNetworks = useMemo(() => {
        const networkNameBySlip44 = new Map<number, string>();
        deviceAccounts.filter(isContactsAccount).forEach(account => {
            const slip44 = accountSlip44(account);
            if (!networkNameBySlip44.has(slip44)) {
                networkNameBySlip44.set(slip44, networkNameForSlip44(slip44, deviceAccounts) ?? '');
            }
        });

        return [...networkNameBySlip44.entries()]
            .map(([slip44, networkName]) => ({ slip44, networkName }))
            .sort((a, b) => a.slip44 - b.slip44);
    }, [deviceAccounts]);

    const theirAddresses = useMemo<AddressEntry[]>(
        () =>
            wallet
                ? inboundAddressEntries(
                      wallet.verifiedAddresses,
                      wallet.spentContactAddresses,
                      npub,
                  )
                : [],
        [wallet, npub],
    );

    const mySharedAddresses = useMemo<AddressEntry[]>(
        () =>
            wallet
                ? outboundAddressEntries(wallet.sharedAddresses, wallet.spentSharedAddresses, npub)
                : [],
        [wallet, npub],
    );

    const getNetworkName = (slip44: number) => networkNameForSlip44(slip44, deviceAccounts);

    const handleRequest = (slip44: number) => {
        dispatch(requestAddressFromContactThunk({ npub, slip44 }));
        setRequestedSlip44s(previous => [...previous, slip44]);

        const timer = setTimeout(() => {
            setRequestedSlip44s(previous => previous.filter(requested => requested !== slip44));
            ackTimersRef.current = ackTimersRef.current.filter(ackTimer => ackTimer !== timer);
        }, REQUEST_ACK_MS);
        ackTimersRef.current.push(timer);
    };

    // With one coin the button reads just "Request address"; with more, each names its network.
    const requestActions = requestableNetworks.length > 0 && (
        <Row gap={4} alignItems="center">
            {requestableNetworks.map(network => {
                const isRequested = requestedSlip44s.includes(network.slip44);

                return (
                    <Tooltip
                        key={network.slip44}
                        content={
                            <Translation
                                id={exchangeBlockReasonId ?? 'TR_CONTACTS_REQUEST_ADDRESS_TOOLTIP'}
                            />
                        }
                    >
                        <Button
                            size="small"
                            intent="neutral"
                            priority="secondary"
                            iconLeft={ArrowsClockwiseIcon}
                            onClick={() => handleRequest(network.slip44)}
                            isDisabled={isRequested || exchangeBlockReasonId !== undefined}
                            data-testid={`@contacts/request-address/${npub}/${network.slip44}`}
                        >
                            <Translation
                                id={
                                    isRequested
                                        ? 'TR_CONTACTS_REQUEST_SENT'
                                        : 'TR_CONTACTS_REQUEST_ADDRESS'
                                }
                            />
                            {requestableNetworks.length > 1 && network.networkName !== ''
                                ? ` · ${network.networkName}`
                                : ''}
                        </Button>
                    </Tooltip>
                );
            })}
        </Row>
    );

    return (
        <Column gap={12} margin={{ top: 4, bottom: 4 }}>
            <AddressList
                titleId="TR_CONTACTS_BUFFER_THEIR_ADDRESSES"
                emptyId="TR_CONTACTS_BUFFER_THEIR_EMPTY"
                entries={theirAddresses}
                getNetworkName={getNetworkName}
                action={requestActions}
            />
            <Divider margin={{ top: 0, bottom: 0 }} />
            <AddressList
                titleId="TR_CONTACTS_BUFFER_MY_SHARED_ADDRESSES"
                emptyId="TR_CONTACTS_BUFFER_MINE_EMPTY"
                entries={mySharedAddresses}
                getNetworkName={getNetworkName}
            />
        </Column>
    );
};
