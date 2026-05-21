import { Client, type ClientOptions, type ErrorResponse, XrplError } from 'xrpl';

export { xrpToDrops, TimeoutError } from 'xrpl';

export const getXrplApi = (server: string, options: ClientOptions) => new Client(server, options);

export const asXrplError = (error: unknown) => {
    if (error instanceof XrplError) {
        return error as XrplError & { data: ErrorResponse | undefined };
    }
};
