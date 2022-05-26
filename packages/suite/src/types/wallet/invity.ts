export type InvityServerEnvironment = 'production' | 'staging1' | 'staging2' | 'localhost';
export type InvityServers = {
    [key in InvityServerEnvironment]: string;
};
