import { URLS } from '@suite-constants';

export default {
    supportedBrowsers: {
        chrome: {
            version: 59,
            download: URLS.CHROME_DOWNLOAD_URL,
            update: URLS.CHROME_UPDATE_URL,
        },
        firefox: {
            version: 54,
            download: URLS.FF_DOWNLOAD_URL,
            update: URLS.FF_UPDATE_URL,
        },
    },
};
