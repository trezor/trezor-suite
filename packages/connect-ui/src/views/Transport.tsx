import { FormattedMessage } from 'react-intl';

import { Button, Image } from '@trezor/components';
import { type UiEvent } from '@trezor/connect';
import { SUITE_URL, SUITE_BRIDGE_DEEPLINK } from '@trezor/urls';
import { useWindowFocus } from '@trezor/react-utils';

import { View } from '../components/View';
import imageSrc from '../images/man_with_laptop.svg';

export type TransportEventProps = Extract<UiEvent, { type: 'ui-no_transport' }>;

export const Transport = () => {
    const windowFocused = useWindowFocus();
    const handleOpenSuite = () => {
        // trigger deep link using iframe (to avoid beforeUnload and avoid opening new blank tab)
        const iframeDeeplink = document.createElement('iframe');
        iframeDeeplink.src = SUITE_BRIDGE_DEEPLINK;
        iframeDeeplink.style.display = 'none';
        document.body.appendChild(iframeDeeplink);

        // fallback in case deeplink does not work
        window.setTimeout(() => {
            if (!windowFocused.current) return;

            window.open(SUITE_URL);
        }, 500);
    };

    return (
        <View
            title={
                <FormattedMessage
                    id="TR_NO_TRANSPORT"
                    defaultMessage="Browser can't communicate with device"
                />
            }
            description={
                <FormattedMessage
                    id="TR_BRIDGE_NEEDED_DESCRIPTION"
                    defaultMessage="Your browser is not supported. For the best experience, download and run the Trezor Suite desktop app in the background, or use a supported Chromium-based browser that is compatible with WebUSB."
                />
            }
            image={<Image imageSrc={imageSrc} />}
            buttons={
                <>
                    <Button
                        variant="primary"
                        icon="arrowUpRight"
                        iconAlignment="right"
                        onClick={handleOpenSuite}
                    >
                        <FormattedMessage
                            id="TR_OPEN_TREZOR_SUITE_DESKTOP"
                            defaultMessage="Open Trezor Suite desktop app"
                        />
                    </Button>
                </>
            }
        />
    );
};
