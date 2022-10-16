export type App = 'suite' | 'connect';

export type Environment = 'desktop' | 'web' | 'mobile' | '';

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
};

export type Event = {
    type: string;
    payload?: {
        [key: string]: string | string[] | number | number[] | boolean | null;
    };
};
