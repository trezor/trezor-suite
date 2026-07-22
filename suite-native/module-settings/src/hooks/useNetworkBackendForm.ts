import { useCallback, useMemo, useState } from 'react';
import { Keyboard } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { yup } from '@suite-common/validators';
import {
    type BackendType,
    type Network,
    type ServerType,
    getServerAddressExample,
    validateServerAddress,
} from '@suite-common/wallet-config';
import {
    type BlockchainRootState,
    blockchainActions,
    reconnectBlockchainThunk,
    selectNetworkBlockchainInfo,
} from '@suite-common/wallet-core';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { type SelectItemType } from '@suite-native/atoms';
import { useForm, useWatch } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';
import TrezorConnect, { BLOCKCHAIN, type BlockchainError } from '@trezor/connect';

type FormValues = {
    serverType: ServerType;
    serverAddress: string;
};

export const useNetworkBackendForm = ({ symbol, backendOptions }: Network) => {
    const dispatch = useDispatch();
    const { translate } = useTranslate();
    const { analytics } = useServices(selectNativeAnalyticsDep);

    const {
        connected,
        backends: { selected, urls },
    } = useSelector((state: BlockchainRootState) => selectNetworkBlockchainInfo(state, symbol));

    const serverTypes = useMemo(() => {
        const defaultItem: SelectItemType<ServerType> = {
            value: 'default',
            label: translate('moduleSettings.networkBackends.server.serverType.defaultLabel'),
        };
        const supportedItems: SelectItemType<BackendType>[] = [
            { value: 'blockbook', label: 'Blockbook' },
            { value: 'electrum', label: 'Electrum' },
            { value: 'ripple', label: 'Ripple' },
            { value: 'blockfrost', label: 'Blockfrost' },
            { value: 'solana', label: 'Solana' },
            { value: 'stellar', label: 'Stellar' },
            { value: 'evm-rpc', label: 'RPC' },
        ];
        const availableItems = supportedItems.filter(({ value }) =>
            backendOptions.some(({ type }) => type === value),
        );

        return symbol !== 'regtest' ? [defaultItem, ...availableItems] : availableItems;
    }, [translate, symbol, backendOptions]);

    const defaultValues = useMemo<FormValues>(
        () => ({
            serverType: selected ?? 'default',
            serverAddress: (selected && urls?.[selected]?.[0]) ?? '',
        }),
        [selected, urls],
    );

    const form = useForm<FormValues>({
        validation: yup.object({
            serverType: yup
                .string<ServerType>()
                .oneOf(serverTypes.map(({ value }) => value))
                .required(),
            serverAddress: yup
                .string()
                .test(
                    'format',
                    translate('moduleSettings.networkBackends.server.invalidFormat'),
                    (value, context) => {
                        const serverType = context.resolve(yup.ref<ServerType>('serverType'));
                        if (serverType === 'default') {
                            return true;
                        }

                        return !!value && validateServerAddress(serverType, value);
                    },
                ),
        }),
        defaultValues,
        mode: 'onSubmit',
    });
    const { isDirty } = form.formState;

    const setServerType = (value: ServerType) => {
        form.clearErrors();
        form.setValue('serverType', value, { shouldDirty: true });
        if (value !== 'default') {
            form.setValue('serverAddress', urls?.[value]?.[0] ?? '', { shouldDirty: true });
        }
    };

    const selectedServerType = useWatch({ control: form.control, name: 'serverType' });
    const isOnionAddress = useWatch({
        control: form.control,
        name: 'serverAddress',
        compute: serverAddress => serverAddress.includes('.onion:'),
    });
    const [isConnecting, setIsConnecting] = useState(false);

    const setBackend = ({ serverType, serverAddress }: FormValues) => {
        dispatch(
            blockchainActions.setBackend({
                symbol,
                type: serverType,
                urls: serverType !== 'default' ? [serverAddress] : [],
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
                            ? 'moduleSettings.networkBackends.server.unableToConnect.tor'
                            : 'moduleSettings.networkBackends.server.unableToConnect.clearnet',
                    ),
                });
                setIsConnecting(false);
            }
        },
        [form, isOnionAddress, translate],
    );

    useFocusEffect(
        useCallback(() => {
            if (isConnecting) {
                TrezorConnect.on(BLOCKCHAIN.CONNECT, onConnectionSuccess);
                TrezorConnect.on(BLOCKCHAIN.ERROR, onConnectionError);

                return () => {
                    TrezorConnect.off(BLOCKCHAIN.CONNECT, onConnectionSuccess);
                    TrezorConnect.off(BLOCKCHAIN.ERROR, onConnectionError);
                };
            }
        }, [isConnecting, onConnectionSuccess, onConnectionError]),
    );

    return {
        hookForm: form,
        isDirty,
        serverTypes,
        selectedServerType,
        setServerType,
        serverAddressExample: getServerAddressExample(symbol, selectedServerType),
        isConnected: connected,
        isConnecting,
        submit,
        discard,
    };
};

export type NetworkBackendForm = ReturnType<typeof useNetworkBackendForm>;
