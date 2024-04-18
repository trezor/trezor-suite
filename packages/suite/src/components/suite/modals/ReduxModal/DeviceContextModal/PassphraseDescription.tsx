import { Icon, Text } from '@trezor/components';
import { PassphraseList, PassphraseItem } from './PassphraseList';

export const PassphraseDescription = () => {
    return (
        <PassphraseList>
            <PassphraseItem>
                <Icon icon="INFO" size={16} />
                <Text>Important to first learn how passphrase works</Text>
            </PassphraseItem>
            <PassphraseItem>
                <Icon icon="ASTERISK" size={16} />
                <Text>Passphrase opens a wallet secured by that phrase</Text>
            </PassphraseItem>
            <PassphraseItem>
                <Icon icon="WARNING" size={16} />
                <Text>No one can recover it, not even Trezor support</Text>
            </PassphraseItem>
        </PassphraseList>
    );
};
