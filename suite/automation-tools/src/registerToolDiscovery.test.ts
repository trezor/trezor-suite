import { isCodesignBuild } from '@trezor/env-utils';

import { TOOL_DISCOVERY_EVENT, registerToolDiscovery } from './registerToolDiscovery';
import { type ToolGroup } from './types';

jest.mock('@trezor/env-utils', () => ({
    ...jest.requireActual('@trezor/env-utils'),
    isCodesignBuild: jest.fn(),
}));

type DiscoveryEvent = CustomEvent & { respondWith?: (group: ToolGroup) => void };
type FlagsWindow = Window & { automationTools?: unknown };

const flagsWindow = window as FlagsWindow;

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
    afterEach(() => {
        delete flagsWindow.automationTools;
        jest.restoreAllMocks();
    });

    describe('in a build that is not codesigned, with the switch on', () => {
        beforeEach(() => {
            jest.mocked(isCodesignBuild).mockReturnValue(false);
            flagsWindow.automationTools = true;
        });

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

    it('registers no listener in a build that is not codesigned while the switch is off', () => {
        jest.mocked(isCodesignBuild).mockReturnValue(false);
        const addEventListener = jest.spyOn(window, 'addEventListener');

        const unregister = registerToolDiscovery(group);

        expect(addEventListener).not.toHaveBeenCalled();
        expect(ask()).toEqual([]);
        expect(unregister).not.toThrow();
    });

    it('registers no listener in a codesigned build even with the switch on', () => {
        jest.mocked(isCodesignBuild).mockReturnValue(true);
        flagsWindow.automationTools = true;
        const addEventListener = jest.spyOn(window, 'addEventListener');

        const unregister = registerToolDiscovery(group);

        expect(addEventListener).not.toHaveBeenCalled();
        expect(ask()).toEqual([]);
        expect(unregister).not.toThrow();
    });
});
