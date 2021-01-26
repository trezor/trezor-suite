export const PROTOCOL = 'file';

export const MODULES = [
    // Event Logging
    { name: 'event-logging/process', dependencies: [] },
    { name: 'event-logging/app', dependencies: [] },
    { name: 'event-logging/contents', dependencies: ['mainWindow'] },
    // Standard modules
    { name: 'menu', dependencies: ['mainWindow'] },
    { name: 'shortcuts', dependencies: ['mainWindow', 'src'] },
    { name: 'request-filter', dependencies: ['mainWindow'] },
    { name: 'external-links', dependencies: ['mainWindow', 'store'] },
    { name: 'window-controls', dependencies: ['mainWindow', 'store'] },
    { name: 'http-receiver', dependencies: ['mainWindow', 'src'] },
    { name: 'metadata', dependencies: [] },
    { name: 'bridge', dependencies: [] },
    { name: 'tor', dependencies: ['mainWindow', 'store'] },
    { name: 'analytics', dependencies: [] },
    // Prod Only
    { name: 'csp', dependencies: ['mainWindow'], isDev: false },
    { name: 'file-protocol', dependencies: ['mainWindow', 'src'], isDev: false },
    { name: 'auto-updater', dependencies: ['mainWindow', 'store'], isDev: false },
    // Dev Only
    { name: 'dev-tools', dependencies: ['mainWindow'], isDev: true },
];
