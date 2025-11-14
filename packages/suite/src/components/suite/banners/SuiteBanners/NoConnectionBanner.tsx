import { Banner } from '@trezor/components';

import { Translation } from 'src/components/suite/Translation';

export const NoConnectionBanner = () => (
    <Banner icon intent="critical">
        <Translation id="TR_YOU_WERE_DISCONNECTED_DOT" />
    </Banner>
);
