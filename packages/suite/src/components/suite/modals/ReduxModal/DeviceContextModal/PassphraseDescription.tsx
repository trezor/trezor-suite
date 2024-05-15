import { Icon, Text } from '@trezor/components';
import { PassphraseList, PassphraseItem } from './PassphraseList';
import { Translation } from 'src/components/suite/Translation';

export const PassphraseDescription = () => {
    return (
        <PassphraseList>
            <PassphraseItem>
                <Icon icon="INFO" size={16} />
                <Text>
                    <Translation id="TR_PASSPHRASE_DESCRIPTION_ITEM1" />
                </Text>
            </PassphraseItem>
            <PassphraseItem>
                <Icon icon="ASTERISK" size={16} />
                <Text>
                    <Translation id="TR_PASSPHRASE_DESCRIPTION_ITEM2" />
                </Text>
            </PassphraseItem>
            <PassphraseItem>
                <Icon icon="WARNING" size={16} />
                <Text>
                    <Translation id="TR_PASSPHRASE_DESCRIPTION_ITEM3" />
                </Text>
            </PassphraseItem>
        </PassphraseList>
    );
};
