export type InvityServerEnvironment = 'production' | 'staging' | 'dev' | 'localhost';
export type InvityServers = {
    [key in InvityServerEnvironment]: string;
};
