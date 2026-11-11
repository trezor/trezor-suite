import { ServiceTimeout, type ServiceTransport } from '../src/serviceTransport';

export const mockServiceTransport = () => {
    const incoming: Buffer[] = [];
    const written: Buffer[] = [];
    const transport: ServiceTransport = {
        read: () => {
            const report = incoming.shift();

            return report ? Promise.resolve(report) : Promise.reject(new ServiceTimeout());
        },
        write: report => {
            written.push(Buffer.from(report));

            return Promise.resolve();
        },
        close: () => Promise.resolve(),
    };

    return { transport, incoming, written };
};
