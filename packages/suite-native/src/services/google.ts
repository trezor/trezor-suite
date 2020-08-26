class Client {
    token?: string;
    nameIdMap: Record<string, string>;
    listPromise?: any;

    constructor(token?: string) {
        this.token = token;
        this.nameIdMap = {};
    }

    async authorize() {}

    async revoke() {}

    async getTokenInfo() {}

    async list() {}

    async get() {}

    async create() {}

    async update() {}

    async getIdByName() {}
}

export default Client;
