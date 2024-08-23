import { IconLegacy, Text } from '@trezor/components';
import { PassphraseList, PassphraseItem } from './PassphraseList';
import { Translation } from 'src/components/suite/Translation';
import { TrezorLink } from 'src/components/suite/TrezorLink';
import { HELP_CENTER_PASSPHRASE_URL } from '@trezor/urls';

export const PassphraseDescription = () => (
    <PassphraseList $gap="small">
        <PassphraseItem>
            <IconLegacy icon="INFO" size={16} />
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
            <IconLegacy icon="ASTERISK" size={16} />
            <Text>
                <Translation id="TR_PASSPHRASE_DESCRIPTION_ITEM2" />
            </Text>
        </PassphraseItem>
        <PassphraseItem>
            <IconLegacy icon="WARNING" size={16} />
            <Text>
                <Translation id="TR_PASSPHRASE_DESCRIPTION_ITEM3" />
            </Text>
        </PassphraseItem>
    </PassphraseList>
);
