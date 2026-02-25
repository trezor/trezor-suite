import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectSelectedDevice } from '@suite-common/device';
import { selectThpStep } from '@suite-common/thp';
import { useAlert } from '@suite-native/alerts';
import { CenteredTitleHeader, Loader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import TrezorConnect from '@trezor/connect';

import { SecurityCodeInput } from './SecurityCodeInput';

type ThpCodeEntryScreenContentProps = {
    onRetry: () => void;
};

export const ThpCodeEntryScreenContent = ({ onRetry }: ThpCodeEntryScreenContentProps) => {
    const { showAlert } = useAlert();

    const thpStep = useSelector(selectThpStep);
    const device = useSelector(selectSelectedDevice);

    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = (tag: string) => {
        if (!device) return;
        setIsLoading(true);
        TrezorConnect.uiResponse({
            type: 'ui-receive_thp_pairing_tag',
            payload: { tag },
            device: { path: device.path },
        });
    };

    useEffect(() => {
        if (thpStep === 'CodeInvalid') {
            showAlert({
                title: <Translation id="thp.codeEntry.invalidCode.title" />,
                description: <Translation id="thp.codeEntry.invalidCode.description" />,
                primaryButtonTitle: <Translation id="thp.codeEntry.invalidCode.getNewCodeButton" />,
                primaryButtonVariant: 'redBold',
                onPressPrimaryButton: onRetry,
            });
        }
    }, [thpStep, showAlert, onRetry]);

    return (
        <VStack marginTop="sp16" spacing="sp32" flex={1}>
            <CenteredTitleHeader
                title={<Translation id="thp.codeEntry.title" />}
                titleVariant="headline-md"
                subtitle={<Translation id="thp.codeEntry.subtitle" />}
            />
            <SecurityCodeInput length={6} onSubmit={onSubmit} />
            {isLoading && <Loader />}
        </VStack>
    );
};
