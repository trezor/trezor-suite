import { TOOL_DISCOVERY_EVENT, registerToolDiscovery } from './registerToolDiscovery';
import { type ToolGroup } from './types';

type DiscoveryEvent = CustomEvent & { respondWith?: (group: ToolGroup) => void };

const group: ToolGroup = { name: 'test', description: 'test group', tools: [] };

const ask = () => {
    const answers: ToolGroup[] = [];
    const event = new CustomEvent(TOOL_DISCOVERY_EVENT) as DiscoveryEvent;
    event.respondWith = answer => {
        answers.push(answer);
    };
    window.dispatchEvent(event);

    return answers;
};

describe(registerToolDiscovery.name, () => {
    it('answers the discovery event synchronously with the group', () => {
        const unregister = registerToolDiscovery(group);

        expect(ask()).toEqual([group]);

        unregister();
    });

    it('answers nothing once the listener is removed', () => {
        const unregister = registerToolDiscovery(group);
        unregister();

        expect(ask()).toEqual([]);
    });

    it('tolerates a dispatch without respondWith', () => {
        const unregister = registerToolDiscovery(group);

        expect(() => window.dispatchEvent(new CustomEvent(TOOL_DISCOVERY_EVENT))).not.toThrow();

        unregister();
    });
});
