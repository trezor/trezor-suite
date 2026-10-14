import { isAutomationToolsEnabled } from './gate';
import { type ToolGroup } from './types';

export const TOOL_DISCOVERY_EVENT = 'devtoolstooldiscovery';

type ToolDiscoveryEvent = Event & { respondWith?: (group: ToolGroup) => void };

/**
 * Answers `devtoolstooldiscovery` with the group, synchronously.
 * Returns the function that removes the listener.
 * It never reads the event, so a page dispatching it learns nothing new.
 * Registers nothing with the gate off, so a codesigned build never answers.
 */
export const registerToolDiscovery = (group: ToolGroup, target: EventTarget = window) => {
    if (!isAutomationToolsEnabled()) {
        return () => {};
    }

    const listener = (event: Event) => {
        (event as ToolDiscoveryEvent).respondWith?.(group);
    };

    target.addEventListener(TOOL_DISCOVERY_EVENT, listener);

    return () => target.removeEventListener(TOOL_DISCOVERY_EVENT, listener);
};
