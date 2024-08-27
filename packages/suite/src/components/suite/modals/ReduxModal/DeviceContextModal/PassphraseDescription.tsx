import { Icon, Text } from '@trezor/components';
import { PassphraseList, PassphraseItem } from './PassphraseList';
import { Translation } from 'src/components/suite/Translation';
import { TrezorLink } from 'src/components/suite/TrezorLink';
import { HELP_CENTER_PASSPHRASE_URL } from '@trezor/urls';

export const PassphraseDescription = () => (
    <PassphraseList $gap="small">
        <PassphraseItem>
            <Icon name="info" size={16} />
            <Text>
                <Translation
                    id="TR_PASSPHRASE_DESCRIPTION_ITEM1"
                    values={{
                        a: chunks => (
                            <TrezorLink
                                target="_blank"
                                variant="underline"
                                href={HELP_CENTER_PASSPHRASE_URL}
                            >
                                {chunks}
                            </TrezorLink>
                        ),
                    }}
                />
            </Text>
        </PassphraseItem>
        <PassphraseItem>
            <Icon name="asterisk" size={16} />
            <Text>
                <Translation id="TR_PASSPHRASE_DESCRIPTION_ITEM2" />
            </Text>
        </PassphraseItem>
        <PassphraseItem>
            <Icon name="warningTriangle" size={16} />
            <Text>
                <Translation id="TR_PASSPHRASE_DESCRIPTION_ITEM3" />
            </Text>
        </PassphraseItem>
    </PassphraseList>
);
