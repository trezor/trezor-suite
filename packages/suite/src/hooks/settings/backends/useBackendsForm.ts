import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useActions, useSelector, useTranslation } from '@suite-hooks';
import { isUrl } from '@trezor/utils';
import { setBackend as setBackendAction } from '@settings-actions/walletSettingsActions';
import type { Network } from '@wallet-types';
import type { BackendType } from '@wallet-reducers/settingsReducer';

export type BackendOption = BackendType | 'default';

type BackendSettings = {
    type: BackendOption;
    urls: string[];
};

const validateUrl = (type: BackendOption, value: string) => {
    switch (type) {
        case 'blockbook':
            return isUrl(value);
        case 'electrum':
            return /^[a-zA-Z0-9.]+:[0-9]{1,5}:[ts]$/.test(value);
        default:
            return false;
    }
};

const getUrlPlaceholder = (coin: Network['symbol'], type: BackendOption) => {
    switch (type) {
        case 'blockbook':
            return `https://${coin}1.trezor.io/`;
        case 'electrum':
            return `electrum.foobar.com:50001:t`;
        default:
            return '';
    }
};

const useBackendUrlInput = (
    coin: Network['symbol'],
    type: BackendOption,
    currentUrls: string[],
) => {
    const { register, watch, setValue, errors } = useForm<{ url: string }>({
        mode: 'onChange',
    });
    const { translationString } = useTranslation();

    const name = 'url';
    const ref = register({
        validate: (value: string) => {
            // Check if URL is valid
            if (!validateUrl(type, value)) {
                return 'TR_CUSTOM_BACKEND_INVALID_URL';
            }

            // Check if already exists
            if (currentUrls.find(url => url === value)) {
                return 'TR_CUSTOM_BACKEND_BACKEND_ALREADY_ADDED';
            }
        },
    });

    const placeholder = translationString('SETTINGS_ADV_COIN_URL_INPUT_PLACEHOLDER', {
        url: getUrlPlaceholder(coin, type),
    });

    return {
        name,
        placeholder,
        ref,
        error: errors[name],
        value: watch(name) || '',
        reset: () => setValue(name, ''),
    };
};

const useInitialSettings = (coin: Network['symbol']): BackendSettings => {
    const { backend } = useSelector(state => ({
        backend: state.wallet.settings.backends[coin],
    }));
    return {
        type: backend?.type ?? (coin === 'regtest' ? 'blockbook' : 'default'),
        urls: backend?.urls ?? [],
    };
};

export const useBackendsForm = (coin: Network['symbol']) => {
    const initial = useInitialSettings(coin);
    const [currentValues, setCurrentValues] = useState(initial);
    const { setBackend } = useActions({
        setBackend: setBackendAction,
    });

    const changeType = (type: BackendOption) => {
        setCurrentValues({
            type,
            urls: [],
        });
    };

    const addUrl = (url: string) => {
        setCurrentValues(({ type, urls }) => ({
            type,
            urls: [...urls, url],
        }));
    };

    const removeUrl = (url: string) => {
        setCurrentValues(({ type, urls }) => ({
            type,
            urls: urls.filter(u => u !== url),
        }));
    };

    const input = useBackendUrlInput(coin, currentValues.type, currentValues.urls);

    const save = () => {
        const { type, urls } = currentValues;
        const lastUrl = input.value && !input.error ? [input.value] : [];
        setBackend({
            coin,
            type: type === 'default' ? 'blockbook' : type,
            urls: type === 'default' ? [] : urls.concat(lastUrl),
        });
    };

    return {
        type: currentValues.type,
        urls: currentValues.urls,
        input,
        addUrl,
        removeUrl,
        changeType,
        save,
    };
};
