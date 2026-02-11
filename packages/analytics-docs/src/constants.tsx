import { Icon, Row } from '@trezor/components';

import { getPlatformIcon } from './utils/getPlatformIcon';

const PlatformItem = ({ platform }: { platform: string }) => (
    <Row alignItems="center" gap={8}>
        <Icon name={getPlatformIcon(platform)} size="medium" />
        {platform}
    </Row>
);

export const platforms = [
    {
        value: 'all',
        label: 'All',
    },
    {
        value: 'desktop',
        label: <PlatformItem platform="desktop" />,
    },
    {
        value: 'mobile',
        label: <PlatformItem platform="mobile" />,
    },
    {
        value: 'shared',
        label: <PlatformItem platform="shared" />,
    },
];

export const sorting = [
    {
        value: 'az',
        label: 'Alphabetical (A-Z)',
    },
    {
        value: 'za',
        label: 'Alphabetical (Z-A)',
    },
    {
        value: 'added',
        label: 'Added',
    },
    {
        value: 'updated',
        label: 'Last updated',
    },
];
