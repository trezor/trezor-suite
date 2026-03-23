import { useCallback, useMemo, useState } from 'react';
import { Keyboard } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import { yup } from '@suite-common/validators';
import { type BackendType } from '@suite-common/wallet-config';
import {
    type BlockchainRootState,
    blockchainActions,
    reconnectBlockchainThunk,
    selectNetworkBlockchainInfo,
} from '@suite-common/wallet-core';
import { events } from '@suite-native/analytics';
import { type SelectItemType } from '@suite-native/atoms';
import { useForm } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';
import { useAnalytics } from '@suite-native/services';
import TrezorConnect, { BLOCKCHAIN, type BlockchainError } from '@trezor/connect';
import { parseElectrumUrl } from '@trezor/utils';

const symbol = 'btc';

export type ServerType = BackendType | 'default';

type FormValues = {
    serverType: ServerType;
    serverAddress: string;
};

export const useBackendServersForm = () => {
    const dispatch = useDispatch();
    const { translate } = useTranslate();
    const analytics = useAnalytics();

    const {
        connected,
        backends: { selected, urls },
    } = useSelector((state: BlockchainRootState) => selectNetworkBlockchainInfo(state, symbol));

    const serverTypes = useMemo<SelectItemType<ServerType>[]>(
        () => [
            {
                value: 'default',
                label: translate(
                    'moduleSettings.advanced.bitcoinBackends.servers.serverTypeDefault',
                ),
            },
            { value: 'electrum', label: 'Electrum' },
        ],
        [translate],
    );

    const defaultValues = useMemo<FormValues>(
        () => ({
            serverType: selected ?? 'default',
            serverAddress: urls?.electrum?.[0] ?? '',
        }),
        [selected, urls],
    );

    const form = useForm({
        validation: yup.object({
            serverType: yup
                .string<ServerType>()
                .oneOf(serverTypes.map(({ value }) => value))
                .required(),
            serverAddress: yup
                .string()
                .test(
                    'format',
                    translate('moduleSettings.advanced.bitcoinBackends.servers.invalidFormat'),
                    value => !!value && !!parseElectrumUrl(value),
                ),
        }),
        defaultValues,
        mode: 'onSubmit',
    });

    const isOnionAddress = form.watch('serverAddress').includes('.onion:');
    const [isConnecting, setIsConnecting] = useState(false);

    const setBackend = ({ serverType, serverAddress }: FormValues) => {
        dispatch(
            blockchainActions.setBackend({
                symbol,
                type: serverType,
                urls: serverType === 'electrum' ? [serverAddress] : [],
            }),
        );
        dispatch(reconnectBlockchainThunk({ symbol }));
        analytics.report({
            type: events.settingsChangeCoinBackendEvent.name,
            payload: { symbol, type: serverType },
        });
    };

    const submit = form.handleSubmit(formValues => {
        setIsConnecting(true);
        setBackend(formValues);
    });

    const discard = () => {
        setBackend(form.formState.defaultValues as FormValues);
    };

    const onConnectionSuccess = useCallback(() => {
        form.reset(defaultValues);
        setIsConnecting(false);
        Keyboard.dismiss();
    }, [form, defaultValues]);

    const onConnectionError = useCallback(
        (e: BlockchainError) => {
            if (e.code === 'Backend_Error') {
                form.setError('serverAddress', {
                    message: translate(
                        isOnionAddress
                            ? 'moduleSettings.advanced.bitcoinBackends.servers.unableToConnect.tor'
                            : 'moduleSettings.advanced.bitcoinBackends.servers.unableToConnect.clearnet',
                    ),
                });
                setIsConnecting(false);
            }
        },
        [form, isOnionAddress, translate],
    );

    useFocusEffect(
        useCallback(() => {
            TrezorConnect.on(BLOCKCHAIN.CONNECT, onConnectionSuccess);
            TrezorConnect.on(BLOCKCHAIN.ERROR, onConnectionError);

            return () => {
                TrezorConnect.off(BLOCKCHAIN.CONNECT, onConnectionSuccess);
                TrezorConnect.off(BLOCKCHAIN.ERROR, onConnectionError);
            };
        }, [onConnectionSuccess, onConnectionError]),
    );

    return {
        form,
        serverTypes,
        isConnected: connected,
        isConnecting,
        submit,
        discard,
    };
};
