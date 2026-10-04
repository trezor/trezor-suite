import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { selectDeviceAccounts } from '@suite-common/wallet-core';
import { Badge, Card, Column, Divider, Icon, IconButton, Row, Text } from '@trezor/components';
import { BellRingingIcon, XIcon } from '@trezor/icons';

import { dismissAddressRequestThunk } from 'src/actions/suite/contactsThunks';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectContactsWallet } from 'src/reducers/suite/contactsReducer';
import { networkNameForSlip44 } from 'src/utils/contacts/coin';
import { npubEncode, shortenNpub } from 'src/utils/contacts/npub';

import { ContactAvatar } from './ContactAvatar';
import { ShareAddressControl } from './ShareAddressControl';

/**
 * Address requests that could not be served automatically, because nothing was shared with that
 * contact for the coin yet. Sharing an address clears the request, so its row disappears.
 */
export const PendingRequests = () => {
    const { device } = useDevice();
    const dispatch = useDispatch();
    const deviceState = device?.state?.staticSessionId;
    const deviceAccounts = useSelector(selectDeviceAccounts);
    const wallet = useSelector(state =>
        deviceState ? selectContactsWallet(state, deviceState) : undefined,
    );

    const requests = Object.values(wallet?.pendingRequests ?? {}).sort(
        (a, b) => b.receivedAt - a.receivedAt,
    );

    if (requests.length === 0) return null;

    return (
        <Card>
            <Column gap={12}>
                <Row gap={8} alignItems="center">
                    <Icon as={BellRingingIcon} size={20} intent="warning" />
                    <Text typographyStyle="body-md-strong">
                        <Translation id="TR_CONTACTS_REQUESTS_TITLE" />
                    </Text>
                    <Badge size="small" intent="warning">
                        {requests.length}
                    </Badge>
                </Row>
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    <Translation id="TR_CONTACTS_REQUESTS_DESCRIPTION" />
                </Text>

                <Divider margin={{ top: 0, bottom: 0 }} />

                <Column gap={0}>
                    {requests.map((request, index) => {
                        const contactName =
                            wallet?.contacts[request.npub]?.label ??
                            shortenNpub(npubEncode(request.npub), 10);
                        // The network the contact asked for, by its real name (for example Bitcoin
                        // Testnet), so the user answers with the right coin.
                        const networkName = networkNameForSlip44(request.slip44, deviceAccounts);

                        return (
                            <Column key={`${request.npub}:${request.slip44}`} gap={0}>
                                {index > 0 && <Divider margin={{ top: 0, bottom: 0 }} />}
                                <Row gap={16} alignItems="center" margin={{ vertical: 8 }}>
                                    <ContactAvatar
                                        seed={request.npub}
                                        label={contactName}
                                        size={40}
                                    />
                                    <Column gap={0} flex="1">
                                        <Text
                                            typographyStyle="body-md-strong"
                                            ellipsisLineCount={1}
                                        >
                                            {contactName}
                                        </Text>
                                        <Row gap={6} alignItems="center">
                                            <Text
                                                typographyStyle="body-sm"
                                                intent="neutral"
                                                priority="secondary"
                                            >
                                                <Translation id="TR_CONTACTS_REQUESTS_WANTS_ADDRESS" />
                                            </Text>
                                            {networkName !== undefined && (
                                                <Badge size="small" intent="neutral">
                                                    {networkName}
                                                </Badge>
                                            )}
                                        </Row>
                                    </Column>
                                    <Row gap={4} alignItems="center">
                                        <ShareAddressControl
                                            npub={request.npub}
                                            slip44={request.slip44}
                                        />
                                        {/* A request for a coin without an account has no share
                                        button, so ignoring is its only way out. Without it the row
                                        would stay, and come back with every relay replay. */}
                                        <IconButton
                                            icon={XIcon}
                                            size="small"
                                            intent="neutral"
                                            priority="secondary"
                                            onClick={() =>
                                                dispatch(
                                                    dismissAddressRequestThunk({
                                                        npub: request.npub,
                                                        slip44: request.slip44,
                                                    }),
                                                )
                                            }
                                            tooltip={{
                                                content: (
                                                    <Translation id="TR_CONTACTS_REQUESTS_IGNORE" />
                                                ),
                                            }}
                                            data-testid={`@contacts/request/ignore/${request.npub}`}
                                        />
                                    </Row>
                                </Row>
                            </Column>
                        );
                    })}
                </Column>
            </Column>
        </Card>
    );
};
