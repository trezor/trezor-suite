import { MAX_LENGTH_MESSAGE } from '@suite/hooks/wallet/sign-verify/useSignVerifyForm';

const AOPP_VERSION = 0;

export const validateUri = (uri: string, network: string | undefined): boolean => {
    let url;
    try {
        url = new URL(uri.replace(/\s/g, ''));
    } catch (error) {
        return false;
    }
    if (url.protocol !== 'aopp:') {
        return false;
    }
    if (url.searchParams.get('v') !== AOPP_VERSION.toString()) {
        return false;
    }
    switch (network) {
        case 'bitcoin':
            if (url.searchParams.get('asset') !== 'btc') {
                return false;
            }
            if (url.searchParams.get('format') !== 'any') {
                return false;
            }
            break;
        case 'ethereum':
            if (url.searchParams.get('asset') !== 'eth') {
                return false;
            }
            if (url.searchParams.get('format') !== 'standard') {
                return false;
            }
            break;
        default:
    }
    if (String(url.searchParams.get('msg')).length > MAX_LENGTH_MESSAGE) {
        return false;
    }
    return true;
};

export const submitProof = async (uri: string, address: string, signature: string) => {
    const url = new URL(uri).searchParams.get('callback');
    if (url) {
        await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                version: AOPP_VERSION,
                address,
                signature,
            }),
        });
    }
};
