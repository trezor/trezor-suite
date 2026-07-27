import { type ReactNode } from 'react';

import { Banner } from '@trezor/components';
import { InfoIcon } from '@trezor/icons';

type SettingsRequirementBannerProps = {
    children: ReactNode;
};

export const SettingsRequirementBanner = ({ children }: SettingsRequirementBannerProps) => (
    <Banner intent="neutral" icon={InfoIcon} description={children} />
);
