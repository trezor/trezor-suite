import { Card } from '@trezor/components';
import { DeviceCompromisedContent } from '@trezor/suite';

import { WelcomeLayout } from '../layouts/WelcomeLayout';

/**
 * Screen displayed when one of the non-interactive security checks has failed, i.e. checks that
 * run automatically, without prompting the user, as part of certain flows.
 * In the happy-case scenario, these checks have no visible UX at all.
 * The interactive checks, meanwhile, are handled by `InteractiveDeviceChecksFlow`.
 */
export const DeviceCompromisedScreen = () => (
    <WelcomeLayout showAccounts={false}>
        <Card data-testid="@device-compromised" paddingType="large">
            <DeviceCompromisedContent />
        </Card>
    </WelcomeLayout>
);
