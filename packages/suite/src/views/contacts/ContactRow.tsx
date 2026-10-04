import styled from 'styled-components';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { Badge, Column, Icon, Row, Text } from '@trezor/components';
import { CaretRightIcon, ShieldCheckIcon } from '@trezor/icons';

import { useSelector } from 'src/hooks/suite';
import { isLocallyAnchored, selectDeviceAuthority } from 'src/reducers/suite/contactsReducer';
import { npubEncode, shortenNpub } from 'src/utils/contacts/npub';

import { ContactAvatar } from './ContactAvatar';

// The whole row is one click target that opens the contact detail, where all per-contact actions
// live, so it is a reset button with a list-item hover rather than a cluster of controls.
const RowButton = styled.button`
    display: block;
    width: 100%;
    padding: 0;
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
    border-radius: 8px;

    &:hover {
        background: ${({ theme }) => theme.elementFillNeutralSoftHovered};
    }
`;

type ContactRowProps = {
    /** Identity, 64-char hex. */
    npub: string;
    label: string;
    onSelect: () => void;
};

export const ContactRow = ({ npub, label, onSelect }: ContactRowProps) => {
    const { device } = useDevice();
    const deviceState = device?.state?.staticSessionId;
    // Verified means anchored on this device, never the stored `isVerified` hint.
    const isVerified = useSelector(
        state =>
            deviceState !== undefined &&
            isLocallyAnchored(selectDeviceAuthority(state, deviceState), npub),
    );
    const encodedNpub = npubEncode(npub);

    return (
        <RowButton type="button" onClick={onSelect} data-testid={`@contacts/row/${npub}`}>
            <Row gap={16} alignItems="center" margin={{ vertical: 8 }}>
                <ContactAvatar seed={npub} label={label} size={40} />
                <Column gap={2} flex="1" alignItems="flex-start">
                    <Row gap={8} alignItems="center">
                        <Text typographyStyle="body-md-strong" ellipsisLineCount={1}>
                            {label}
                        </Text>
                        {isVerified ? (
                            <Badge size="small" intent="brand" iconLeft={ShieldCheckIcon}>
                                <Translation id="TR_CONTACTS_VERIFIED" />
                            </Badge>
                        ) : (
                            <Badge size="small" intent="neutral">
                                <Translation id="TR_CONTACTS_NOT_VERIFIED" />
                            </Badge>
                        )}
                    </Row>
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        {shortenNpub(encodedNpub, 10)}
                    </Text>
                </Column>
                <Icon as={CaretRightIcon} size={18} intent="neutral" priority="secondary" />
            </Row>
        </RowButton>
    );
};
