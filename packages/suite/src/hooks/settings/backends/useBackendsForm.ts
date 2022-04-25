import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useActions, useSelector, useTranslation, useAnalytics } from '@suite-hooks';
import { isUrl } from '@trezor/utils';
import { isOnionUrl } from '@suite-utils/tor';
import { setBackend, resetBackend } from '@wallet-actions/blockchainActions';
import { isElectrumUrl } from '@suite-utils/backend';
import type { Network, BackendType } from '@wallet-types';
import type { BackendSettings } from '@wallet-reducers/blockchainReducer';

export type BackendOption = BackendType | 'default';

type BackendsFormData = {
    type: BackendOption;
    urls: string[];
};

const validateUrl = (type: BackendOption, value: string) => {
    switch (type) {
        case 'blockbook':
            return isUrl(value);
        case 'blockfrost':
            return isUrl(value);
        case 'electrum':
            return isElectrumUrl(value);
        default:
            return false;
    }
};

const getUrlPlaceholder = (coin: Network['symbol'], type: BackendOption) => {
    switch (type) {
        case 'blockbook':
            return `https://${coin}1.trezor.io/`;
        case 'blockfrost':
            return `wss://blockfrost.io`;
        case 'electrum':
            return `electrum.example.com:50001:t`;
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

const getStoredState = (
    coin: Network['symbol'],
    type?: BackendOption,
    urls?: BackendSettings['urls'],
): BackendsFormData => ({
    type: type ?? (coin === 'regtest' ? 'blockbook' : 'default'),
    urls: (type && type !== 'default' && urls?.[type]) || [],
});

export const useBackendsForm = (coin: Network['symbol']) => {
    const analytics = useAnalytics();
    const backends = useSelector(state => state.wallet.blockchain[coin].backends);
    const initial = getStoredState(coin, backends.selected, backends.urls);
    const [currentValues, setCurrentValues] = useState(initial);
    const actions = useActions({
        setBackend,
        resetBackend,
    });

    const changeType = (type: BackendOption) => {
        setCurrentValues(getStoredState(coin, type, backends.urls));
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

    const getUrls = () => {
        const lastUrl = input.value && !input.error ? [input.value] : [];
        return currentValues.urls.concat(lastUrl);
    };

    const hasOnlyOnions = () => {
        const urls = getUrls();
        return !!urls.length && urls.every(isOnionUrl);
    };

    const save = () => {
        const { type } = currentValues;
        const urls = type === 'default' ? [] : getUrls();
        if (type === 'default') {
            actions.resetBackend(coin);
        } else {
            actions.setBackend(coin, type, urls);
        }
        const totalOnion = urls.filter(isOnionUrl).length;

        analytics.report({
            type: 'settings/coin-backend',
            payload: {
                symbol: coin,
                type,
                totalRegular: urls.length - totalOnion,
                totalOnion,
            },
        });
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
    };
};
