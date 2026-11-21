import { type ToolGroup } from './types';

export const TOOL_DISCOVERY_EVENT = 'devtoolstooldiscovery';

type ToolDiscoveryEvent = Event & { respondWith?: (group: ToolGroup) => void };

/**
 * Answers chrome-devtools-mcp's `devtoolstooldiscovery` event, and any other consumer's identical
 * dispatch, with the group. The answer is synchronous: the MCP resolves at once when it can and
 * in-page code reads it without awaiting. The listener never reads the event's payload, so a page
 * dispatching the event itself learns nothing it could not already reach on the same origin.
 * Returns the function that removes the listener.
 */
export const registerToolDiscovery = (group: ToolGroup, target: EventTarget = window) => {
    const listener = (event: Event) => {
        (event as ToolDiscoveryEvent).respondWith?.(group);
    };

    target.addEventListener(TOOL_DISCOVERY_EVENT, listener);

    return () => target.removeEventListener(TOOL_DISCOVERY_EVENT, listener);
};
