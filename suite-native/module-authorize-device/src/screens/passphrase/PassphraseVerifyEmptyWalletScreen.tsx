import { useDispatch } from 'react-redux';
import { useEffect } from 'react';

import { isFulfilled } from '@reduxjs/toolkit';

import { AlertBox, Text, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    finishPassphraseFlow,
    verifyPassphraseOnEmptyWalletThunk,
} from '@suite-native/device-authorization';
import { EventType, analytics } from '@suite-native/analytics';

import { PassphraseForm } from '../../components/passphrase/PassphraseForm';
import { PassphraseContentScreenWrapper } from '../../components/passphrase/PassphraseContentScreenWrapper';

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
        <PassphraseContentScreenWrapper
            title={
                <Translation id="modulePassphrase.emptyPassphraseWallet.verifyEmptyWallet.title" />
            }
            subtitle={
                <Translation id="modulePassphrase.emptyPassphraseWallet.verifyEmptyWallet.description" />
            }
        >
            <VStack spacing="sp16">
                <AlertBox
                    variant="warning"
                    title={
                        <Text variant="hint">
                            <Translation
                                id="modulePassphrase.emptyPassphraseWallet.verifyEmptyWallet.alertTitle"
                                values={{
                                    bold: chunks => <Text variant="callout">{chunks}</Text>,
                                }}
                            />
                        </Text>
                    }
                />
                <PassphraseForm
                    inputLabel={translate('modulePassphrase.form.verifyPassphraseInputLabel')}
                />
            </VStack>
        </PassphraseContentScreenWrapper>
    );
};
