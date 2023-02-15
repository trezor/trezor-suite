export type App = 'suite' | 'connect' | 'mobile';

export type Environment = 'desktop' | 'web' | '';

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
