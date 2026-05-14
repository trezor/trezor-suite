import { Icon, Row } from '@trezor/components';

import { type Platform, type Sort } from './types';
import { getPlatformIcon } from './utils/getPlatformIcon';

export const HEADER_HEIGHT = 110;

const PlatformItem = ({ platform }: { platform: string }) => (
    <Row alignItems="center" gap={8}>
        <Icon name={getPlatformIcon(platform)} size={16} />
        {platform}
    </Row>
);

export const platforms: { value: Platform; label: React.ReactNode }[] = [
    {
        value: 'all',
        label: 'All platforms',
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

export const sorting: { value: Sort; label: string }[] = [
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
