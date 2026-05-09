import styled from 'styled-components';

import { Button } from '@trezor/components';

import * as trezorConnectActions from '../actions/trezorConnectActions';
import { getField } from '../components/Method';
import { useActions, useSelector } from '../hooks';

export const SettingsContent = styled.section`
    flex: 1;
    padding: 10px 20px;
    display: flex;
    flex-direction: column;
`;

export const ConfirmationMessage = styled.div`
    margin-top: 20px;
    color: green;
    font-weight: bold;
`;

export const ErrorMessage = styled(ConfirmationMessage)`
    color: red;
`;

export const Settings = () => {
    const coreMode = useSelector(state => state?.connect?.options?.coreMode);

    const initError = useSelector(state => state.connect?.initError);
    const isInitSuccess = useSelector(state => state.connect?.isInitSuccess || false);
    const isHandshakeConfirmed = useSelector(state => state.connect?.isHandshakeConfirmed || false);
    const actions = useActions({
        onSubmitInit: trezorConnectActions.onSubmitInit,
        onFieldChange: trezorConnectActions.onConnectOptionChange,
    });

    const submitButton = 'Init Connect';
    const fields = [
        {
            name: 'coreMode',
            type: 'select' as const,
            value: coreMode || 'auto',
            data: [
                { value: 'auto', label: 'Auto' },
                { value: 'deeplink', label: 'Deeplink (mobile)' },
                { value: 'suite-desktop', label: 'Suite desktop' },
                { value: 'suite-web', label: 'Suite web' },
            ],
        },
    ];

    return (
        <SettingsContent>
            {/* @ts-expect-error: actions is simplified for this case */}
            {fields.map(field => getField(field, { actions }))}
            <Button onClick={actions.onSubmitInit} data-testid="@submit-button">
                {submitButton}
            </Button>
            {initError && (
                <ErrorMessage data-testid="@settings/init-error">
                    Init error: {initError}
                </ErrorMessage>
            )}
            {isInitSuccess && (
                <ConfirmationMessage data-testid="@settings/init-success">
                    Init success!
                </ConfirmationMessage>
            )}
            {isHandshakeConfirmed && (
                <ConfirmationMessage data-testid="@settings/handshake-confirmed">
                    Handshake confirmed!
                </ConfirmationMessage>
            )}
        </SettingsContent>
    );
};
