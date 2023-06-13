import { Environment } from '@trezor/env-utils';

export type App = 'suite' | 'connect';

export type InitOptions = {
    sessionId?: string;
    instanceId?: string;
    environment?: Environment;
    isDev: boolean;
    commitId: string;
    callbacks?: {
        onEnable?: () => void;
        onDisable?: () => void;
    };
    /* after analytics is enabled, report events happened before enablement */
    useQueue?: boolean;
};

export type Event = {
    type: string;
    payload?: {
        [key: string]: string | string[] | number | number[] | boolean | null;
    };
};

export type ReportConfig = {
    anonymize?: boolean; // Log event without session and instance ID to prevent linking it to other events.
    force?: boolean; // Log event while analytics are not enabled.
};
