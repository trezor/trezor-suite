import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { events } from '@suite/analytics';
import { useTranslation } from '@suite/intl';
import { type BackendType, type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { blockchainActions } from '@suite-common/wallet-core';
import { type BackendSettings } from '@suite-common/wallet-types';
import { isElectrumUrl } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { isUrlWithQuery } from '@trezor/utils';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';
import { isOnionUrl } from 'src/utils/suite/tor';

export type BackendOption = BackendType | 'default';

type BackendsFormData = {
    type: BackendOption;
    urls: string[];
};

const validateUrl = (type: BackendOption, value: string) => {
    switch (type) {
        case 'blockbook':
            return isUrlWithQuery(value);
        case 'blockfrost':
            return isUrlWithQuery(value);
        case 'electrum':
            return isElectrumUrl(value);
        case 'solana':
            return isUrlWithQuery(value);
        case 'ripple':
            return isUrlWithQuery(value);
        case 'stellar':
            return isUrlWithQuery(value);
        case 'evm-rpc':
            return isUrlWithQuery(value);
        default:
            return false;
    }
};

const getUrlPlaceholder = (symbol: NetworkSymbol, type: BackendOption) => {
    switch (type) {
        case 'blockbook':
            return `https://${symbol}.trezor.io/`;
        case 'blockfrost':
            return `wss://${symbol}.trezor.io/`;
        case 'electrum':
            return `electrum.example.com:50001:t`;
        case 'solana':
        case 'stellar':
        case 'evm-rpc':
            return 'https://';
        case 'ripple':
            return 'wss://';
        default:
            return '';
    }
};

const useBackendUrlInput = (symbol: NetworkSymbol, type: BackendOption, currentUrls: string[]) => {
    const {
        register,
        watch,
        setValue,
        formState: { errors },
    } = useForm<{ url: string }>({
        mode: 'onChange',
    });
    const { translationString } = useTranslation();

    const name = 'url' as const;
    const validate = (value: string) => {
        // Check if URL is valid
        if (!validateUrl(type, value)) {
            return translationString('TR_CUSTOM_BACKEND_INVALID_URL');
        }

        // Check if already exists
        if (currentUrls.find(url => url === value)) {
            return translationString('TR_CUSTOM_BACKEND_BACKEND_ALREADY_ADDED');
        }
    };

    const placeholder = translationString('SETTINGS_ADV_COIN_URL_INPUT_PLACEHOLDER', {
        url: getUrlPlaceholder(symbol, type),
    });

    return {
        name,
        placeholder,
        register,
        validate,
        error: errors[name],
        value: watch(name) || '',
        reset: () => setValue(name, ''),
    };
};

const getStoredState = (
    symbol: NetworkSymbol,
    type?: BackendOption,
    urls?: BackendSettings['urls'],
): BackendsFormData => ({
    type: type ?? (symbol === 'regtest' ? 'blockbook' : 'default'),
    urls: (type && type !== 'default' && urls?.[type]) || [],
});

export const useBackendsForm = (symbol: NetworkSymbol) => {
    const analytics = useAnalytics();
    const backends = useSelector(state => state.wallet.blockchain[symbol].backends);
    const dispatch = useDispatch();
    const { translationString } = useTranslation();
    const [currentValues, setCurrentValues] = useState(() =>
        getStoredState(symbol, backends.selected, backends.urls),
    );
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    useEffect(() => {
        setCurrentValues(getStoredState(symbol, backends.selected, backends.urls));
        setValidationError(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [symbol]);

    const changeType = (type: BackendOption) => {
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

    const input = useBackendUrlInput(symbol, currentValues.type, currentValues.urls);

    const getUrls = () => {
        const lastUrl = input.value && !input.error ? [input.value] : [];

        return currentValues.urls.concat(lastUrl);
    };

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
                const result = await TrezorConnect.blockchainValidateEvmRpcUrl({
                    url,
                    chainId: expectedChainId,
                });

                if (!result.success) {
                    setValidationError(
                        translationString('TR_CUSTOM_BACKEND_CONNECTION_ERROR', { url }),
                    );
                    setIsValidating(false);

                    return false;
                }

                if (!result.payload.valid) {
                    const { actualChainId } = result.payload;
                    setValidationError(
                        translationString('TR_CUSTOM_BACKEND_CHAIN_MISMATCH', {
                            url,
                            expected: `${network.name} (${expectedChainId})`,
                            actual: actualChainId?.toString() || 'unknown',
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

        if (type === 'evm-rpc' && urls.length > 0) {
            const isValid = await validateEvmRpcUrls(urls);
            if (!isValid) {
                return false;
            }
        }

        dispatch(blockchainActions.setBackend({ symbol, type, urls }));
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
        save,
        isValidating,
        validationError,
    } as const;
};

export type BackendsForm = ReturnType<typeof useBackendsForm>;
