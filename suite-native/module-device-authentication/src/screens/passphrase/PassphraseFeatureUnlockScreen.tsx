import { useTranslate } from '@suite-native/intl';

import { PassphraseContentScreenWrapper } from '../../components/passphrase/PassphraseContentScreenWrapper';
import { PassphraseForm } from '../../components/passphrase/PassphraseForm';

export const PassphraseFeatureUnlockScreen = () => {
    const { translate } = useTranslate();

    return (
        <PassphraseContentScreenWrapper
            title={translate('modulePassphrase.passphraseFeatureUnlock.title')}
            isWalletRemovedOnClose={false}
        >
            <PassphraseForm
                inputLabel={translate('modulePassphrase.passphraseFeatureUnlock.label')}
            />
        </PassphraseContentScreenWrapper>
    );
};
