import {
    SUITE_URL,
    CHROME_URL,
    FIREFOX_URL,
    CHROME_UPDATE_URL,
    FIREFOX_UPDATE_URL,
    CHROME_ANDROID_URL,
} from '@trezor/urls';
import { getDeviceType, getBrowserName, getBrowserVersion, getOsNameWeb } from '@trezor/env-utils';

import style from './styles.css';
import iconChrome from '../../files/images/browsers/chrome.svg';
import iconFirefox from '../../files/images/browsers/firefox.svg';
import iconDesktop from '../../files/images/browsers/desktop.svg';

type SupportedBrowser = {
    name: string;
    urlDownload: string;
    urlUpdate?: string;
    icon: string;
    isPreferred: boolean;
};

type MainHtmlProps = {
    title: string;
    subtitle: string;
    continueToSuite?: boolean;
    supportedDevicesList?: boolean;
    supportedBrowsers?: SupportedBrowser[];
    shouldUpdate?: boolean;
};

window.addEventListener('load', () => {
    const getSupportedBrowsersPartial = ({ supportedBrowsers, shouldUpdate }: MainHtmlProps) =>
        supportedBrowsers
            ? `<div class="${style.browsers}">
            ${supportedBrowsers
                .map(
                    (item: SupportedBrowser) => `
                <a href="${shouldUpdate && item.urlUpdate ? item.urlUpdate : item.urlDownload}
                " target="_blank" rel="noopener noreferrer" class="${style.browser}">
                    <img src="${item.icon}" class="${style.image}"/>
                    <p class="${style.name}">${item.name}</p>
                    <div class="${style.button} ${
                        item.isPreferred ? style.buttonPrimary : style.buttonSecondary
                    }">
                        ${shouldUpdate && item.urlUpdate ? 'Update' : 'Download'}
                    </div>
                </a>`,
                )
                .join('')}
        </div>`
            : '';

    const getSupportedDevicesList = (props: MainHtmlProps) =>
        props.supportedDevicesList
            ? `<ul class=${style.list}>
                <li>Trezor Suite desktop app</li>
                <li>Trezor Suite for web </li>
                <li>Mobile web app for Chrome on Android</li>
            </ul>`
            : '';

    const getContinueToSuiteInfo = (props: MainHtmlProps) =>
        props.continueToSuite
            ? `<div class=${style.hr}></div>
                <p class=${style.continueInfo}>
                Using outdated or unsupported browsers can expose you to security risks.
                <br>
                To keep your funds safe, we recommend using the latest version of a supported browser.
                </p>
                <p class=${style.continueButton} id="continue-to-suite" data-test="@continue-to-suite">Continue at my own risk</p>`
            : '';

    const getMainHtml = (props: MainHtmlProps) => `
    <div id="unsupported-browser" class="${style.container}" data-test="@browser-detect">
        <h1 class="${style.title}">${props.title}</h1>
        <p class="${style.subtitle}">${props.subtitle}</p>
        ${getSupportedDevicesList(props)}
        ${getSupportedBrowsersPartial(props)}
        ${getContinueToSuiteInfo(props)}
    </div>
    `;

    const desktop = {
        name: 'Desktop App',
        urlDownload: SUITE_URL,
        icon: iconDesktop,
        isPreferred: true,
    };

    const chrome = {
        name: 'Chrome 84+',
        urlDownload: CHROME_URL,
        urlUpdate: CHROME_UPDATE_URL,
        icon: iconChrome,
        isPreferred: false,
    };

    const firefox = {
        name: 'Firefox 102+',
        urlDownload: FIREFOX_URL,
        urlUpdate: FIREFOX_UPDATE_URL,
        icon: iconFirefox,
        isPreferred: false,
    };

    const chromeMobile = {
        name: 'Chrome for Android',
        urlDownload: CHROME_ANDROID_URL,
        icon: iconChrome,
        isPreferred: false,
    };

    const titleUnsupported = 'Your browser is not supported';
    const titleOutdated = 'Your browser is outdated';

    const primarySubtitle =
        'We recommend using the Trezor Suite desktop app for the best experience.';
    const secondarySubtitleDownload =
        'Alternatively, download a supported browser to use the Trezor Suite web app.';
    const secondarySubtitleUpdate =
        'Alternatively, update your web browser to the latest version to use the Trezor Suite web app.';

    const unsupportedBrowser = getMainHtml({
        title: titleUnsupported,
        subtitle: `${primarySubtitle}<br>${secondarySubtitleDownload}`,
        supportedBrowsers: [desktop, chrome, firefox],
        continueToSuite: true,
    });

    const updateChrome = getMainHtml({
        title: titleOutdated,
        subtitle: `${primarySubtitle}<br>${secondarySubtitleUpdate}`,
        supportedBrowsers: [desktop, chrome],
        continueToSuite: true,
        shouldUpdate: true,
    });

    const updateFirefox = getMainHtml({
        title: titleOutdated,
        subtitle: `${primarySubtitle}<br>${secondarySubtitleUpdate}`,
        supportedBrowsers: [desktop, firefox],
        continueToSuite: true,
        shouldUpdate: true,
    });

    const getChromeAndroid = getMainHtml({
        title: titleUnsupported,
        subtitle: 'The Trezor Suite mobile web app is only supported in Chrome for Android.',
        supportedBrowsers: [chromeMobile],
        continueToSuite: true,
    });

    const iOS = getMainHtml({
        title: 'Suite doesn’t work on iOS yet',
        subtitle:
            'We’re working hard to bring the Trezor Suite mobile web app to iOS. In the meantime, you can use Trezor Suite on the following platforms:',
        supportedDevicesList: true,
    });

    // this should match browserslist config (packages/suite-build/browserslist)
    const supportedBrowsers = [
        {
            name: 'chrome',
            version: 92,
            mobile: true,
        },
        {
            name: 'chromium',
            version: 92,
            mobile: true,
        },
        {
            name: 'firefox',
            version: 102,
            mobile: false, // no webusb support
        },
    ] as const;

    const browserName = getBrowserName();
    const browserVersion = getBrowserVersion();

    const isMobile = getDeviceType() === 'mobile';
    const supportedBrowser = supportedBrowsers.find(
        browser => browser.name.toLowerCase() === browserName.toLowerCase(),
    );
    const updateRequired =
        supportedBrowser && browserVersion
            ? supportedBrowser.version > parseInt(browserVersion, 10)
            : false;

    const goToSuite = () => {
        const child = document.getElementById('unsupported-browser');
        child?.parentNode?.removeChild(child);

        // browser-detection styles are removed because they should not be available and used in app
        // styles.css gets id="browser-detection-style" on its <style> tag due to "style-loader" configuration in webpack
        const style = document.getElementById('browser-detection-style');
        style?.parentNode?.removeChild(style);

        const appDiv = document.createElement('div');
        appDiv.id = 'app';
        document.body.appendChild(appDiv);
    };

    const setBody = (content: string) => {
        document.body.innerHTML = '';
        document.body.insertAdjacentHTML('afterbegin', content);

        document.getElementById('continue-to-suite')?.addEventListener('click', goToSuite);
    };

    if (getOsNameWeb() === 'iOS') {
        // Any iOS device: no WebUSB support (suggest to download iOS app?)
        setBody(iOS);
    } else if (isMobile && (!supportedBrowser || (supportedBrowser && !supportedBrowser.mobile))) {
        // Unsupported mobile browser: get Chrome for Android
        setBody(getChromeAndroid);
    } else if (!supportedBrowser) {
        // Unsupported browser
        setBody(unsupportedBrowser);
    } else if (updateRequired) {
        if (supportedBrowser.name === 'chrome' || supportedBrowser.name === 'chromium') {
            // Outdated browser: update Chrome
            setBody(updateChrome);
        }
        if (supportedBrowser.name === 'firefox') {
            // Outdated browser: update Firefox
            setBody(updateFirefox);
        }
    } else {
        // Inject app div
        goToSuite();
    }
});
