import { createMemoryHistory } from 'history';

import { mock, mockNotExpected } from '@trezor/dependency-injection';
import { isCodesignBuild } from '@trezor/env-utils';

import { loadSuiteAutomationTools } from './loadSuiteAutomationTools';
import { type registerSuiteAutomationTools } from './registerSuiteAutomationTools';
import {
    type SuiteAutomationToolsDeps,
    type SuiteAutomationToolsStore,
} from './registerSuiteAutomationToolsTypes';

type FlagsWindow = Window & {
    automationTools?: unknown;
    desktopFlags?: { automationTools?: boolean };
};

const flagsWindow = window as FlagsWindow;

const mockRegisterSuiteAutomationTools = mock<typeof registerSuiteAutomationTools>();
const mockChunk = { requests: 0 };

jest.mock('@trezor/env-utils', () => ({
    ...jest.requireActual('@trezor/env-utils'),
    isCodesignBuild: jest.fn(),
}));

// Stands in for the lazy chunk: the factory runs on `import()`, so it counts chunk requests.
jest.mock('./registerSuiteAutomationTools', () => {
    mockChunk.requests += 1;

    return { registerSuiteAutomationTools: mockRegisterSuiteAutomationTools };
});

const createDeps = (): SuiteAutomationToolsDeps => ({
    store: {
        getState: mockNotExpected<SuiteAutomationToolsStore['getState']>('getState'),
        dispatch: mockNotExpected<SuiteAutomationToolsStore['dispatch']>('dispatch'),
    },
    history: createMemoryHistory(),
    desktopApi: null,
    connect: null,
});

describe(loadSuiteAutomationTools.name, () => {
    beforeEach(() => {
        jest.resetModules();
        mockChunk.requests = 0;
        mockRegisterSuiteAutomationTools.mockClear();
    });

    afterEach(() => {
        delete flagsWindow.automationTools;
        delete flagsWindow.desktopFlags;
    });

    describe('in a codesigned build', () => {
        beforeEach(() => {
            jest.mocked(isCodesignBuild).mockReturnValue(true);
        });

        it.each<{ switchedOnBy: string; flags: Partial<FlagsWindow> }>([
            { switchedOnBy: 'nothing', flags: {} },
            { switchedOnBy: 'window.automationTools', flags: { automationTools: true } },
            {
                switchedOnBy: 'the --automation-tools desktop flag',
                flags: { desktopFlags: { automationTools: true } },
            },
            {
                switchedOnBy: 'both switches',
                flags: { automationTools: true, desktopFlags: { automationTools: true } },
            },
        ])('never requests the chunk when switched on by $switchedOnBy', async ({ flags }) => {
            Object.assign(flagsWindow, flags);

            await loadSuiteAutomationTools(createDeps());

            expect(mockChunk.requests).toBe(0);
            expect(mockRegisterSuiteAutomationTools).not.toHaveBeenCalled();
        });
    });

    describe('in a build that is not codesigned', () => {
        beforeEach(() => {
            jest.mocked(isCodesignBuild).mockReturnValue(false);
        });

        it('never requests the chunk while nothing switched the tools on', async () => {
            await loadSuiteAutomationTools(createDeps());

            expect(mockChunk.requests).toBe(0);
            expect(mockRegisterSuiteAutomationTools).not.toHaveBeenCalled();
        });

        it('requests the chunk and registers the tools once window.automationTools is set', async () => {
            flagsWindow.automationTools = true;
            const deps = createDeps();

            await loadSuiteAutomationTools(deps);

            expect(mockChunk.requests).toBe(1);
            expect(mockRegisterSuiteAutomationTools).toHaveBeenCalledTimes(1);
            expect(mockRegisterSuiteAutomationTools).toHaveBeenCalledWith(deps);
        });

        it('requests the chunk and registers the tools under the --automation-tools desktop flag', async () => {
            flagsWindow.desktopFlags = { automationTools: true };
            const deps = createDeps();

            await loadSuiteAutomationTools(deps);

            expect(mockChunk.requests).toBe(1);
            expect(mockRegisterSuiteAutomationTools).toHaveBeenCalledWith(deps);
        });
    });
});
