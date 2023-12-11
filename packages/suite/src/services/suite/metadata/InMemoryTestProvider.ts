import { AbstractMetadataProvider } from 'src/types/suite/metadata';

export class InMemoryTestProvider extends AbstractMetadataProvider {
    #files: Record<string, string> = {};

    isCloud = false;
    constructor() {
        super('inMemoryTest');
    }

    get clientId() {
        return this.type;
    }

    connect() {
        return Promise.resolve(this.ok());
    }

    disconnect() {
        return Promise.resolve(this.ok());
    }

    // eslint-disable-next-line
    async getProviderDetails() {
        return this.ok({
            type: this.type,
            isCloud: this.isCloud,
            tokens: {},
            user: '',
            clientId: this.clientId,
        });
    }

    getFileContent(file: string) {
        return Promise.resolve(this.ok(Buffer.from(this.#files[file], 'hex')));
    }

    setFileContent(file: string, content: Buffer) {
        this.#files[file] = content.toString('hex');

        return Promise.resolve(this.ok(undefined));
    }

    getFilesList() {
        return Promise.resolve(this.ok(Object.keys(this.#files)));
    }

    renameFile(from: string, to: string) {
        this.#files[to] = this.#files[from];
        delete this.#files[from];

        return Promise.resolve(this.ok(undefined));
    }

    isConnected() {
        return true;
    }
}
