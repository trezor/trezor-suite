import { Translation } from '@suite/intl';
import { Button, Card, Column, H3, Paragraph, Row, Text } from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';

import { useContactIdentity } from './useContactIdentity';
import { ContactsErrorMessage } from '../ContactsErrorMessage';

export const IdentityCard = () => {
    const { npub, error, isShowing, showOnTrezor } = useContactIdentity();

    return (
        <Card data-testid="@contacts/identity">
            <Column gap={12} alignItems="stretch">
                <H3>
                    <Translation id="TR_CONTACTS_IDENTITY_TITLE" />
                </H3>
                <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                    <Translation id="TR_CONTACTS_IDENTITY_DESCRIPTION" />
                </Paragraph>

                {npub !== undefined ? (
                    <Text isMonospaced typographyStyle="body-sm" data-testid="@contacts/own-npub">
                        {npub}
                    </Text>
                ) : (
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_CONTACTS_IDENTITY_MISSING" />
                    </Text>
                )}

                {error !== undefined && (
                    <Text typographyStyle="body-sm" intent="critical">
                        <ContactsErrorMessage error={error} />
                    </Text>
                )}

                <Row gap={8}>
                    <Button
                        size="small"
                        isLoading={isShowing}
                        onClick={showOnTrezor}
                        data-testid="@contacts/own-npub/show-on-trezor"
                    >
                        <Translation id="TR_CONTACTS_SHOW_ON_TREZOR" />
                    </Button>
                    {npub !== undefined && (
                        <Button
                            size="small"
                            priority="secondary"
                            onClick={() => copyToClipboard(npub)}
                        >
                            <Translation id="TR_COPY_TO_CLIPBOARD" />
                        </Button>
                    )}
                </Row>
            </Column>
        </Card>
    );
};
