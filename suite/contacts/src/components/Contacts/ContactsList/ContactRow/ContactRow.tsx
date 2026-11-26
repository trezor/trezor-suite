import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import {
    type ContactsRootState,
    selectContactWardStatus,
    shortenNpub,
} from '@suite-common/contacts';
import { Badge, Button, Column, Row, Text } from '@trezor/components';
import { type StaticSessionId } from '@trezor/connect';

import { type ContactRowAction, useContactRowActions } from './useContactRowActions';
import { ContactsErrorMessage } from '../../ContactsErrorMessage';

export type ContactRowProps = {
    staticSessionId: StaticSessionId;
    npub: string;
    name: string;
};

export const ContactRow = ({ staticSessionId, npub, name }: ContactRowProps) => {
    const wardStatus = useSelector((state: ContactsRootState) =>
        selectContactWardStatus(state, staticSessionId, npub),
    );
    const { pendingAction, outcome, run } = useContactRowActions(npub);

    const isBusy = pendingAction !== undefined;
    const getButtonProps = (action: ContactRowAction) => ({
        size: 'small' as const,
        isLoading: pendingAction === action,
        isDisabled: isBusy && pendingAction !== action,
        onClick: () => run(action),
    });

    return (
        <Column gap={8} alignItems="stretch" data-testid={`@contacts/contact/${name}`}>
            <Row gap={8} justifyContent="space-between" flexWrap="wrap">
                <Column alignItems="flex-start">
                    <Row gap={8}>
                        <Text typographyStyle="body-md-strong">{name}</Text>
                        {wardStatus === 'queued' && (
                            <Badge intent="warning">
                                <Translation id="TR_CONTACTS_STATUS_QUEUED" />
                            </Badge>
                        )}
                        {wardStatus === 'written' && (
                            <Badge intent="brand">
                                <Translation id="TR_CONTACTS_STATUS_WRITTEN" />
                            </Badge>
                        )}
                    </Row>
                    <Text
                        isMonospaced
                        typographyStyle="body-xs"
                        intent="neutral"
                        priority="secondary"
                    >
                        {shortenNpub(npub)}
                    </Text>
                </Column>
                <Row gap={8} flexWrap="wrap">
                    <Button priority="secondary" {...getButtonProps('show')}>
                        <Translation id="TR_CONTACTS_SHOW_ON_TREZOR" />
                    </Button>
                    <Button priority="secondary" {...getButtonProps('writeAgain')}>
                        <Translation id="TR_CONTACTS_WRITE_AGAIN" />
                    </Button>
                    <Button intent="critical" priority="secondary" {...getButtonProps('remove')}>
                        <Translation id="TR_CONTACTS_REMOVE" />
                    </Button>
                </Row>
            </Row>

            {outcome?.type === 'error' && (
                <Text typographyStyle="body-sm" intent="critical">
                    <ContactsErrorMessage error={outcome.error} />
                </Text>
            )}
            {outcome?.type === 'queued' && (
                <Text typographyStyle="body-sm" intent="warning">
                    <Translation id="TR_CONTACTS_RESULT_QUEUED" />
                </Text>
            )}
        </Column>
    );
};
