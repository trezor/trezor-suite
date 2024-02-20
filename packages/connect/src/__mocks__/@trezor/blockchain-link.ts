type Listener = (...args: any[]) => void;

class BlockchainLink {
    name = 'jest-mocked-module';

    /* EventEmitter functionality mock */
    private readonly listeners: [string, Listener][] = [];
    private emit(event: string, ...args: any[]) {
        this.listeners.filter(([e]) => e === event).forEach(([_, listener]) => listener(...args));
    }
    on(event: string, listener: Listener) {
        this.listeners.push([event, listener]);
    }
    removeAllListeners() {
        this.listeners.splice(0, this.listeners.length);
    }
    listenerCount(event: string) {
        return this.listeners.filter(([e]) => e === event).length;
    }
    /* */

    constructor(args: any) {
        this.name = args.name;
    }

    connect() {
        return Promise.resolve(true);
    }
    disconnect() {
        this.emit('disconnected');

        return Promise.resolve(true);
    }
    dispose() {}
    getInfo() {
        return Promise.resolve({
            url: this.name,
            name: this.name,
            shortcut: this.name,
            consensusBranchId: 1001,
        });
    }
    estimateFee(params: { blocks: number[] }) {
        return Promise.resolve(params.blocks.map(() => ({ feePerUnit: '-1' })));
    }
    subscribe() {
        return Promise.resolve({ subscribed: true });
    }
}

module.exports = {
    __esModule: true,
    default: BlockchainLink,
};
