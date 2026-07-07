import { type ReactNode } from 'react';

import { Banner } from '@trezor/components';

type SettingsRequirementBannerProps = {
    children: ReactNode;
};

export const SettingsRequirementBanner = ({ children }: SettingsRequirementBannerProps) => (
    <Banner intent="neutral" icon="info" description={children} />
);
