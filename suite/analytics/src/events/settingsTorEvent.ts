import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    value: AttributeDef<boolean>;
    location: AttributeDef<string>;
    modal?: AttributeDef<string>;
};

export const settingsTorEvent: EventDef<Attributes, EventType.SettingsTor> = {
    name: EventType.SettingsTor,
    descriptionTrigger: 'User toggles Tor network support in Settings > Application > TOR or during onboarding',
    changelog: [
        { version: '1.1.0', notes: 'added' },
        { version: '1.19.0', notes: 'Renamed from `menu/toggle-tor` to `settings/tor`' },
        { version: '25.4.0', notes: 'updated' },
    ],

    attributes: {
        value: {
            description: 'Whether Tor is enabled (true) or disabled (false)',
            changelog: [{ version: '1.1.0', notes: 'added' }],
        },
        location: {
            description: 'Where the toggle was accessed from: "settings" for Settings menu, "onboarding" for initial setup',
            changelog: [{ version: '25.4.0', notes: 'added' }],
        },
        modal: {
            description: 'Type of modal shown when toggling: "warning" for confirmation dialog, "info" for information message, or undefined if none shown',
            changelog: [{ version: '25.4.0', notes: 'added' }],
        },
    },
};
