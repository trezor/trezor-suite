import React from 'react';

import { addons, types } from 'storybook/manager-api';

const ADDON_ID = 'trezor/theme-toggle';
const TOOL_ID = `${ADDON_ID}/tool`;

addons.register(ADDON_ID, api => {
    addons.add(TOOL_ID, {
        type: types.TOOL,
        title: 'Theme Toggle',
        match: ({ viewMode }) => viewMode === 'story',
        render: () => {
            const globals = api.getGlobals();

            const currentMode = globals.mode || 'light';
            const nextMode = currentMode === 'light' ? 'dark' : 'light';

            return (
                <button
                    onClick={() => api.updateGlobals({ mode: nextMode })}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 14,
                        padding: '4px 10px',
                        color: 'inherit',
                    }}
                    title={`Switch to ${nextMode} mode`}
                >
                    <span style={{ fontSize: 18 }}>{currentMode === 'light' ? '🌑' : '☀️'}</span>
                    <span>{currentMode === 'light' ? 'Dark theme' : 'Light theme'}</span>
                </button>
            );
        },
    });
});
