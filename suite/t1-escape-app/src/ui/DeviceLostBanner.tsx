import { Banner } from '@trezor/components';

import { describeDeviceLost } from './messages';
import type { DeviceLostReason } from '../device/deviceSession';

type DeviceLostBannerProps = {
    reason: DeviceLostReason;
};

export const DeviceLostBanner = ({ reason }: DeviceLostBannerProps) => (
    <Banner
        intent="critical"
        title="Stop. Do not confirm anything on the Trezor."
        description={`${describeDeviceLost(reason)} This tool no longer controls what the Trezor shows. If it asks you to confirm anything, reject it. Unplug the Trezor, close other wallet applications, and reload this page to start again.`}
    />
);
