import { Button, Link, Image } from '@trezor/components';
import type { UiEvent } from '@trezor/connect';
import { SUITE_URL } from '@trezor/urls';

import { View } from '../components/View';
import imageSrc from '../images/man_with_laptop.svg';

export type TransportEventProps = Extract<UiEvent, { type: 'ui-no_transport' }>;

export const Transport = () => (
    <View
        title="Device cannot be found"
        description="We recommend downloading and running the Trezor Suite desktop app in the background for the best experience. Alternatively, use a supported browser that is compatible with WebUSB"
        image={<Image imageSrc={imageSrc} />}
        buttons={
            <>
                <Link variant="nostyle" href={SUITE_URL} onClick={() => window.closeWindow()}>
                    <Button variant="primary" icon="EXTERNAL_LINK" iconAlignment="right">
                        {/* todo: can we somehow check if the app is installed (not running ) and present a deeplink in that case? */}
                        Download
                    </Button>
                </Link>
            </>
        }
    />
);
