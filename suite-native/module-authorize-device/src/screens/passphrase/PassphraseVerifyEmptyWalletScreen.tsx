import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { isFulfilled } from '@reduxjs/toolkit';

import { EventType, analytics } from '@suite-native/analytics';
import { InlineAlertBox, Text, TitleHeader, VStack } from '@suite-native/atoms';
import {
    finishPassphraseFlow,
    verifyPassphraseOnEmptyWalletThunk,
} from '@suite-native/device-authorization';
import { Translation, useTranslate } from '@suite-native/intl';
import { Screen } from '@suite-native/navigation';

import { PassphraseForm } from '../../components/passphrase/PassphraseForm';
import { PassphraseScreenHeader } from '../../components/passphrase/PassphraseScreenHeader';

export const PassphraseVerifyEmptyWalletScreen = () => {
    const dispatch = useDispatch();

    const { translate } = useTranslate();

    useEffect(() => {
        const verifyEmptyWallet = async () => {
            const result = await dispatch(verifyPassphraseOnEmptyWalletThunk());
            if (isFulfilled(result)) {
                analytics.report({
                    type: EventType.PassphraseFlowFinished,
                    payload: { isEmptyWallet: true },
                });
                dispatch(finishPassphraseFlow());
            }
        };
        verifyEmptyWallet();
    }, [dispatch]);

    return (
        <Screen header={<PassphraseScreenHeader />}>
            <VStack marginTop="sp8" spacing="sp16">
                <TitleHeader
                    title={
                        <Translation id="modulePassphrase.emptyPassphraseWallet.verifyEmptyWallet.title" />
                    }
                    subtitle={
                        <Translation id="modulePassphrase.emptyPassphraseWallet.verifyEmptyWallet.description" />
                    }
                    titleVariant="titleMedium"
                />
                <InlineAlertBox
                    variant="warning"
                    title={
                        <Translation
                            id="modulePassphrase.emptyPassphraseWallet.verifyEmptyWallet.alertTitle"
                            values={{
                                bold: chunks => <Text variant="callout">{chunks}</Text>,
                            }}
                        />
                    }
                />
                <PassphraseForm
                    inputLabel={translate('modulePassphrase.form.verifyPassphraseInputLabel')}
                />
            </VStack>
        </Screen>
    );
};
