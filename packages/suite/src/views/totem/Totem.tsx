import { selectIsDebugModeActive } from '@suite/debug';
import { Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { useLayout, useSelector } from 'src/hooks/suite';

import { TotemDebugLog } from './TotemDebugLog';
import { TotemKeeper } from './TotemKeeper';
import { TotemMember } from './TotemMember';

// Totem — raise a totem (publish local services over a Tor onion for your tribe) and join
// other people's totems. Desktop-only: it drives local nodes and the bundled Tor server.
export const Totem = () => {
    useLayout('Totem', <PageHeader />);
    // The raw event log is a developer aid, so keep it out of the normal UI (debug mode only).
    const isDebugModeActive = useSelector(selectIsDebugModeActive);

    return (
        <Column gap={spacings.lg} alignItems="stretch" margin={spacings.md}>
            <TotemKeeper />
            <TotemMember />
            {isDebugModeActive && <TotemDebugLog />}
        </Column>
    );
};
