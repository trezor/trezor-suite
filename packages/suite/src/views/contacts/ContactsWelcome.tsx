import { Translation } from '@suite/intl';
import { Button, Card, Column, Text } from '@trezor/components';

type ContactsWelcomeProps = {
    /** Marks onboarding complete and returns to the normal Contacts page. */
    onDone: () => void;
};

/**
 * First-run screen of the Contacts page, shown once per wallet (see `isOnboarded`). The contact
 * identity is derived on the device from the wallet, so there is nothing to set up.
 */
export const ContactsWelcome = ({ onDone }: ContactsWelcomeProps) => (
    <Card data-testid="@contacts/welcome">
        <Column gap={24}>
            <Column gap={4} alignItems="center">
                <Text typographyStyle="body-md-strong">
                    <Translation id="TR_CONTACTS_WELCOME_TITLE" />
                </Text>
                <Text
                    typographyStyle="body-sm"
                    intent="neutral"
                    priority="secondary"
                    align="center"
                >
                    <Translation id="TR_CONTACTS_WELCOME_DESC" />
                </Text>
            </Column>

            <Column gap={8}>
                <Column gap={2}>
                    <Text typographyStyle="body-sm-strong">
                        <Translation id="TR_CONTACTS_MY_IDENTITY" />
                    </Text>
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_CONTACTS_WELCOME_NEW_DESC" />
                    </Text>
                </Column>
                <Button width="100%" onClick={onDone} data-testid="@contacts/welcome/use-derived">
                    <Translation id="TR_CONTACTS_WELCOME_NEW_CTA" />
                </Button>
            </Column>
        </Column>
    </Card>
);
