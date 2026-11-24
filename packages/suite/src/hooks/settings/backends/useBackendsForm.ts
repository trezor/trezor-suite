import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { useTranslation } from '@suite/intl';
import { isOnionUrl } from '@suite/tor';
import { selectIsMevProtectionFeatureEnabled } from '@suite-common/mev';
import {
    type NetworkSymbol,
    type ServerType,
    getNetwork,
    getServerAddressExample,
    validateServerAddress,
} from '@suite-common/wallet-config';
import {
    blockchainActions,
    selectIsMevProtectionEnabled,
    selectNetworkBlockchainInfo,
} from '@suite-common/wallet-core';
import { type BackendSettings } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from '#src/hooks/suite/useSelector';

type BackendsFormData = {
    type: ServerType;
    urls: string[];
};

const useBackendUrlInput = (symbol: NetworkSymbol, type: ServerType, currentUrls: string[]) => {
    const {
        register,
        control,
        setValue,
        formState: { errors },
    } = useForm<{ url: string }>({
        mode: 'onChange',
    });
    const { translationString } = useTranslation();

    const name = 'url' as const;
    const validate = (value: string) => {
        if (!validateServerAddress(type, value)) {
            return translationString('TR_CUSTOM_BACKEND_INVALID_URL');
        }
        if (currentUrls.includes(value)) {
            return translationString('TR_CUSTOM_BACKEND_BACKEND_ALREADY_ADDED');
        }
    };

    const placeholder = translationString('SETTINGS_ADV_COIN_URL_INPUT_PLACEHOLDER', {
        url: getServerAddressExample(symbol, type),
    });

    const value = useWatch({ control, name });

    return {
        name,
        placeholder,
        register,
        validate,
        error: errors[name],
        value: value || '',
        reset: () => setValue(name, ''),
    };
};

const getStoredState = (
    symbol: NetworkSymbol,
    type?: ServerType,
    urls?: BackendSettings['urls'],
): BackendsFormData => ({
    type: type ?? (symbol === 'regtest' ? 'blockbook' : 'default'),
    urls: (type && type !== 'default' && urls?.[type]) || [],
});

export const useBackendsForm = (symbol: NetworkSymbol) => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const backends = useSelector(state => selectNetworkBlockchainInfo(state, symbol).backends);
    const { translationString } = useTranslation();
    const [currentValues, setCurrentValues] = useState(() =>
        getStoredState(symbol, backends.selected, backends.urls),
    );
    const [broadcastUrls, setBroadcastUrls] = useState(() => backends.broadcastUrls ?? []);
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    const network = getNetwork(symbol);
    const isBroadcastSupported = network.networkType === 'ethereum';
    // MEV protection is applied by blockbook when it broadcasts, a custom broadcast backend skips it.
    const isMevProtectionEnabled = useSelector(selectIsMevProtectionEnabled);
    const isMevProtectionFeatureEnabled = useSelector(selectIsMevProtectionFeatureEnabled);
    const isMevProtectionActive =
        isMevProtectionEnabled &&
        isMevProtectionFeatureEnabled &&
        network.features.includes('mev-protection');

    useEffect(() => {
        setCurrentValues(getStoredState(symbol, backends.selected, backends.urls));
        setBroadcastUrls(backends.broadcastUrls ?? []);
        setValidationError(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [symbol]);

    const changeType = (type: ServerType) => {
        setCurrentValues(getStoredState(symbol, type, backends.urls));
        setValidationError(null);
    };

    const addUrl = (url: string) => {
        setCurrentValues(({ type, urls }) => ({
            type,
            urls: [...urls, url],
        }));
        setValidationError(null);
    };

    const removeUrl = (url: string) => {
        setCurrentValues(({ type, urls }) => ({
            type,
            urls: urls.filter(u => u !== url),
        }));
        setValidationError(null);
    };

    const addBroadcastUrl = (url: string) => {
        setBroadcastUrls(urls => [...urls, url]);
        setValidationError(null);
    };

    const removeBroadcastUrl = (url: string) => {
        setBroadcastUrls(urls => urls.filter(u => u !== url));
        setValidationError(null);
    };

    const input = useBackendUrlInput(symbol, currentValues.type, currentValues.urls);
    const broadcastInput = useBackendUrlInput(symbol, 'evm-rpc', broadcastUrls);

    // A valid url typed into the input counts as added, the user does not have to press add first.
    const withPendingUrl = (urls: string[], urlInput: typeof input) =>
        urlInput.value && !urlInput.error ? [...urls, urlInput.value] : urls;

    const getUrls = () => withPendingUrl(currentValues.urls, input);

    const hasOnlyOnions = () => {
        const urls = getUrls();

        return !!urls.length && urls.every(isOnionUrl);
    };

    const validateEvmRpcUrls = async (urls: string[]): Promise<boolean> => {
        setIsValidating(true);
        setValidationError(null);

        const network = getNetwork(symbol);
        const expectedChainId = network.chainId;

        if (!expectedChainId) {
            setValidationError(translationString('TR_CUSTOM_BACKEND_NETWORK_MISSING_CHAIN_ID'));
            setIsValidating(false);

            return false;
        }

        for (const url of urls) {
            try {
                const result = await TrezorConnect.blockchainEvmRpcGetChainId({ url });

                if (!result.success) {
                    setValidationError(
                        translationString('TR_CUSTOM_BACKEND_CONNECTION_ERROR', { url }),
                    );
                    setIsValidating(false);

                    return false;
                }

                if (result.payload.chainId !== expectedChainId) {
                    setValidationError(
                        translationString('TR_CUSTOM_BACKEND_CHAIN_MISMATCH', {
                            url,
                            expected: `${network.name} (${expectedChainId})`,
                            actual: result.payload.chainId.toString(),
                        }),
                    );
                    setIsValidating(false);

                    return false;
                }
            } catch {
                setValidationError(
                    translationString('TR_CUSTOM_BACKEND_VALIDATION_ERROR', { url }),
                );
                setIsValidating(false);

                return false;
            }
        }

        setIsValidating(false);

        return true;
    };

    const save = async (): Promise<boolean> => {
        const { type } = currentValues;
        const urls = type === 'default' ? [] : getUrls();
        const broadcast = isBroadcastSupported
            ? withPendingUrl(broadcastUrls, broadcastInput)
            : undefined;

        const evmRpcUrls = [...(type === 'evm-rpc' ? urls : []), ...(broadcast ?? [])];
        if (evmRpcUrls.length > 0) {
            const isValid = await validateEvmRpcUrls(evmRpcUrls);
            if (!isValid) {
                return false;
            }
        }

        dispatch(blockchainActions.setBackend({ symbol, type, urls, broadcastUrls: broadcast }));
        const totalOnion = urls.filter(isOnionUrl).length;

        analytics.report({
            type: events.settingsCoinsBackendEvent.name,
            payload: {
                symbol,
                type,
                totalRegular: urls.length - totalOnion,
                totalOnion,
            },
        });

        return true;
    };

    return {
        type: currentValues.type,
        urls: currentValues.urls,
        input,
        hasOnlyOnions,
        addUrl,
        removeUrl,
        changeType,
        isBroadcastSupported,
        isMevProtectionActive,
        broadcastUrls,
        broadcastInput,
        addBroadcastUrl,
        removeBroadcastUrl,
        save,
        isValidating,
        validationError,
    } as const;
};

export type BackendsForm = ReturnType<typeof useBackendsForm>;
