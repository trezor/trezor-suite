import { Transport } from '../transports/abstract';

// First transport that inits successfully is the final one; others won't even start initiating.
export const getAvailableTransport = async (
    transports: Transport[],
    debug: boolean,
): Promise<Transport> => {
    let lastError: any = null;
    // eslint-disable-next-line no-restricted-syntax
    for (const transport of transports) {
        try {
            await transport.init(debug);
            return transport;
        } catch (error) {
            lastError = error;
        }
    }
    throw lastError || new Error('No transport could be initialized.');
};
