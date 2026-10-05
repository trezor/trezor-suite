import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import {
    Banner,
    Box,
    Button,
    Card,
    CollapsibleBox,
    Column,
    Row,
    Text,
    Tooltip,
} from '@trezor/components';
import { QrCode } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';
import { selectContactsWallet } from 'src/reducers/suite/contactsReducer';
import { getContactsErrorTranslationKey } from 'src/utils/contacts/contactsErrors';
import { npubEncode, shortenNpub } from 'src/utils/contacts/npub';

import { ContactAvatar } from './ContactAvatar';
import { CopyIconButton } from './CopyIconButton';
import { useMyIdentityLoad } from './useMyIdentityLoad';

export const MyIdentityCard = () => {
    const { device, isLocked } = useDevice();
    const deviceState = device?.state?.staticSessionId;
    // Reading the identity is a device call, so a locked or disconnected device is its gate.
    const isDeviceLocked = isLocked();
    const identityNpub = useSelector(state =>
        deviceState ? selectContactsWallet(state, deviceState)?.identityNpub : undefined,
    );
    const { isLoading, error, load } = useMyIdentityLoad({
        deviceState,
        identityNpub,
        isDeviceLocked,
    });

    const npub = identityNpub ? npubEncode(identityNpub) : undefined;

    return (
        <Card>
            <Column gap={16}>
                <Row gap={16} alignItems="center">
                    <ContactAvatar seed={identityNpub ?? 'me'} size={48} />
                    <Column gap={2} flex="1">
                        <Text typographyStyle="body-md-strong">
                            <Translation id="TR_CONTACTS_MY_IDENTITY" />
                        </Text>
                        {npub !== undefined ? (
                            <Row gap={4} alignItems="center">
                                <Text
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                    data-testid="@contacts/my-identity/npub"
                                >
                                    {shortenNpub(npub, 12)}
                                </Text>
                                <CopyIconButton
                                    value={npub}
                                    dataTestId="@contacts/my-identity/copy"
                                />
                            </Row>
                        ) : (
                            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                                <Translation
                                    id={
                                        isLoading
                                            ? 'TR_CONTACTS_IDENTITY_LOADING'
                                            : 'TR_CONTACTS_MY_IDENTITY_DESCRIPTION'
                                    }
                                />
                            </Text>
                        )}
                    </Column>
                    {!identityNpub && (
                        <Tooltip
                            content={
                                isDeviceLocked ? (
                                    <Translation id="TR_CONTACTS_LOAD_IDENTITY_LOCKED" />
                                ) : undefined
                            }
                        >
                            <Button
                                size="small"
                                onClick={load}
                                isLoading={isLoading}
                                isDisabled={!deviceState || isDeviceLocked}
                                data-testid="@contacts/load-identity"
                            >
                                <Translation id="TR_CONTACTS_LOAD_IDENTITY" />
                            </Button>
                        </Tooltip>
                    )}
                </Row>

                {error !== null && (
                    <Banner
                        intent="critical"
                        icon
                        description={
                            <Translation id={getContactsErrorTranslationKey(error.code)} />
                        }
                    />
                )}

                {npub !== undefined && (
                    <CollapsibleBox
                        heading={<Translation id="TR_CONTACTS_IDENTITY_QR_SECTION" />}
                        headingSize="small"
                        paddingType="none"
                        fillType="none"
                        defaultIsOpen={false}
                        data-testid="@contacts/my-identity/details"
                    >
                        <Column alignItems="center" gap={12} margin={{ top: 12, bottom: 0 }}>
                            <Box width={180} height={180}>
                                <QrCode value={npub} />
                            </Box>
                            <Text
                                typographyStyle="body-xs"
                                intent="neutral"
                                priority="secondary"
                                align="center"
                            >
                                <Translation id="TR_CONTACTS_MY_IDENTITY_DESCRIPTION" />
                            </Text>
                        </Column>
                    </CollapsibleBox>
                )}

                {/* A contact's Trezor shows this Key as 64 hex characters when they verify me. */}
                {identityNpub !== undefined && (
                    <CollapsibleBox
                        heading={<Translation id="TR_CONTACTS_MY_IDENTITY_KEY_SECTION" />}
                        headingSize="small"
                        paddingType="none"
                        fillType="none"
                        defaultIsOpen={false}
                        data-testid="@contacts/my-identity/key"
                    >
                        <Column gap={8} margin={{ top: 12, bottom: 0 }}>
                            <Text typographyStyle="body-sm" isMonospaced wordBreak="break-all">
                                {identityNpub}
                            </Text>
                            <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
                                <Translation id="TR_CONTACTS_MY_IDENTITY_KEY_DESCRIPTION" />
                            </Text>
                        </Column>
                    </CollapsibleBox>
                )}
            </Column>
        </Card>
    );
};
