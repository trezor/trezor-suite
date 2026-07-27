import { applyBridgeApiCallHeaders } from '../utils/applyBridgeApiCallHeaders';

export const ping = (url: string) =>
    fetch(url, {
        method: 'POST',
        headers: applyBridgeApiCallHeaders({
            headers: {},
            contentType: 'text/plain',
            skipContentTypeHeader: true,
        }),
    })
        .then(res => res.json())
        .then(res => typeof res?.version === 'string')
        .catch(() => false);
