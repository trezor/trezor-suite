import UAParser from 'ua-parser-js';

import style from './styles.css';
import iconChrome from './images/browser-chrome.png';
import iconFirefox from './images/browser-firefox.png';

type SupportedBrowser = {
    name: string;
    url: string;
    icon: string;
};

type MainHtmlProps = {
    title: string;
    subtitle: string;
    button?: string;
    url?: string;
    supportedBrowsers?: SupportedBrowser[];
};

const getButtonPartial = (props: MainHtmlProps) =>
    props.button && props.url
        ? `<a href="${props.url}" target="_blank" class="${style.button}" rel="noopener noreferrer">${props.button}</a>`
        : ``;

const getSupportedBrowsersPartial = (supportedBrowsers?: SupportedBrowser[]) =>
    supportedBrowsers
        ? `<div class="${style.browsers}">
            ${supportedBrowsers
                .map(
                    (item: SupportedBrowser) => `
                <div class="${style.browser}">
                    <img src="${item.icon}" height="56px" />
                    <div class="${style.download}">
                        <a href="${item.url}" target="_blank" class="${style.button}" rel="noopener noreferrer">
                            Get ${item.name}
                        </a>
                    </div>
                </div>`,
                )
                .join('')}
        </div>`
        : ``;

const getMainHtml = (props: MainHtmlProps) => `
<div class="${style.container}" data-test="@browser-detect">
    <h1 class="${style.title}">${props.title}</h1>
    <p class="${style.subtitle}">${props.subtitle}</p>
    ${getButtonPartial(props)}
    ${getSupportedBrowsersPartial(props.supportedBrowsers)}
</div>
`;

window.addEventListener('load', () => {
    const unsupportedBrowser = getMainHtml({
        title: 'Your browser is not supported',
        subtitle: 'Please choose one of the supported browsers',
        supportedBrowsers: [
            {
                name: 'Chrome',
                url: 'https://www.google.com/chrome/',
                icon: iconChrome,
            },
            {
                name: 'Firefox',
                url: 'https://www.mozilla.org/firefox/',
                icon: iconFirefox,
            },
        ],
    });

    const updateChrome = getMainHtml({
        title: 'Your browser is outdated',
        subtitle: 'Please update your browser to the latest version.',
        button: 'Update Chrome',
        url: 'https://support.google.com/chrome/answer/95414?co=GENIE.Platform%3DDesktop&amp;hl=en',
    });

    const updateFirefox = getMainHtml({
        title: 'Your browser is outdated',
        subtitle: 'Please update your browser to the latest version.',
        button: 'Update Firefox',
        url: 'https://support.mozilla.org/en-US/kb/update-firefox-latest-release',
    });

    const getChromeAndroid = getMainHtml({
        title: 'Get Chrome for Android',
        subtitle: 'WebUSB is only supported on Chrome for Android.',
        button: 'Get Chrome for Android',
        url: 'https://play.google.com/store/apps/details?id=com.android.chrome&hl=en',
    });

    const noWebUSB = getMainHtml({
        title: 'No WebUSB support',
        subtitle: 'WebUSB is only supported on Chrome for Android.',
    });

    // this should match browserslist config
    const supportedBrowsers = [
        {
            name: 'Chrome',
            version: 69,
            mobile: true,
        },
        {
            name: 'Chromium',
            version: 69,
            mobile: true,
        },
        {
            name: 'Firefox',
            version: 62,
            mobile: false, // no webusb support
        },
    ];

    const parser = new UAParser();
    const result = parser.getResult();

    const isMobile = result.device.type === 'mobile';
    const supportedBrowser = supportedBrowsers.find(
        browser => browser.name === result.browser.name,
    );
    const updateRequired =
        supportedBrowser && result.browser.version
            ? supportedBrowser.version > parseInt(result.browser.version, 10)
            : false;

    const setBody = (content: string) => {
        document.body.innerHTML = '';
        document.body.insertAdjacentHTML('afterbegin', content);
    };

    if (result.os.name === 'iOS') {
        // Any iOS device: no WebUSB support (suggest to download iOS app?)
        setBody(noWebUSB);
    } else if (isMobile && (!supportedBrowser || (supportedBrowser && !supportedBrowser.mobile))) {
        // Unsupported mobile browser: get Chrome for Android
        setBody(getChromeAndroid);
    } else if (updateRequired) {
        if (supportedBrowser?.name === 'Chrome' || supportedBrowser?.name === 'Chromium') {
            // Outdated browser: update Chrome
            setBody(updateChrome);
        }
        if (supportedBrowser?.name === 'Firefox') {
            // Outdated browser: update Firefox
            setBody(updateFirefox);
        }
    } else if (!supportedBrowser) {
        // Unsupported browser
        setBody(unsupportedBrowser);
    } else {
        // Inject app div
        const appDiv = document.createElement('div');
        appDiv.id = 'app';
        document.body.appendChild(appDiv);
    }
});
