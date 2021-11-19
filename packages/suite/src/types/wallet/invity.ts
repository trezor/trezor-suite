export type InvityServerEnvironment = 'production' | 'staging' | 'localhost';
export type InvityServerType = 'api' | 'authentication';

export type InvityServer = {
    [key in InvityServerType]: string;
};

export type InvityServers = {
    [key in InvityServerEnvironment]: InvityServer;
};
