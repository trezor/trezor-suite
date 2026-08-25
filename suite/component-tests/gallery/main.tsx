import { flushSync } from 'react-dom';

import { type Root, createRoot } from 'react-dom/client';

import { installBrowserPolyfills } from '@trezor/suite-build/browserPolyfills';

/**
 * The story gallery: the page Playwright's `mount` fixture drives. It implements the contract from
 * https://playwright.dev/docs/test-components — `window.mount()` renders a story into `#root` and
 * `window.unmount()` tears it down.
 *
 * The `import.meta.glob` has to stay inline: Vite resolves it statically, relative to this file, so
 * it cannot move into shared code. Everything app-specific belongs in a story, not here.
 */
installBrowserPolyfills();

const stories = import.meta.glob<Record<string, unknown>>('../stories/**/*.story.tsx');

const toStoryPath = (file: string) =>
    file.replace(/^(\.\.\/)+stories\//, '').replace(/\.story\.\w+$/, '');

const resolveStory = async (storyId: string) => {
    const separator = storyId.lastIndexOf('/');
    if (separator === -1) return undefined;
    const path = storyId.slice(0, separator);
    const exportName = storyId.slice(separator + 1);

    const file = Object.keys(stories).find(candidate => toStoryPath(candidate) === path);
    if (!file) return undefined;

    const module = await stories[file]!();

    return module[exportName] ?? module.default;
};

const rootElement = document.getElementById('root')!;
let root: Root | undefined;

type MountParams = { story: string; props?: Record<string, unknown> };

const mount = async ({ story, props }: MountParams) => {
    const Story = (await resolveStory(story)) as React.ComponentType | undefined;
    if (!Story) {
        throw new Error(`Unknown story: ${story}`);
    }

    // Reuse the root across calls so `component.update(props)` reconciles instead of remounting,
    // which is what preserves component state across a prop change.
    root ??= createRoot(rootElement);
    // flushSync so a render error rejects this promise instead of being swallowed by React.
    flushSync(() => root!.render(<Story {...props} />));
};

// The contract expects a promise back, but there is nothing to await.
const unmount = () => {
    root?.unmount();
    root = undefined;

    return Promise.resolve();
};

Object.assign(window, { mount, unmount });
