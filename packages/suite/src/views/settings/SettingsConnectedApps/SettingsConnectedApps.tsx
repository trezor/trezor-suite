import { Paragraph } from '@trezor/components';

import { SettingsLayout, SettingsSection } from 'src/components/settings';

import { WalletConnect } from './WalletConnect';

export const SettingsConnectedApps = () => (
    <SettingsLayout>
        <SettingsSection title="WalletConnect">
            <Paragraph variant="tertiary">Manage and connect to WalletConnect apps.</Paragraph>
            <WalletConnect />
        </SettingsSection>
    </SettingsLayout>
);
