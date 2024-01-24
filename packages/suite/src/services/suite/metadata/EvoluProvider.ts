/* eslint-disable no-underscore-dangle */

import { AbstractMetadataProvider } from 'src/types/suite/metadata';
import * as S from '@effect/schema/Schema';
import { String, createEvolu, id, table, database, Owner, parseMnemonic } from '@evolu/react';
import { Evolu } from '@evolu/common';
import { createHash } from 'crypto';
import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { Effect, Exit } from 'effect';

const FileId = id('File');
type FileId = S.Schema.To<typeof FileId>;

const MetadataTable = table({
    id: FileId,
    fileName: String,
    content: String,
});
type MetadataTable = S.Schema.To<typeof MetadataTable>;

const Database = database({
    file: MetadataTable,
});

const deriveMnemonic = (metadataKey: string) => {
    const keyBuffer = Buffer.from(metadataKey, 'hex');
    const hash = createHash('sha256').update(keyBuffer).digest('hex').slice(0, 32);
    const mnemonic = bip39.entropyToMnemonic(new Uint8Array(Buffer.from(hash, 'hex')), wordlist);
    return mnemonic;
};

class EvoluProvider extends AbstractMetadataProvider {
    isCloud = true;
    evolu: Evolu<any>;
    owner: Owner | null = null;
    deviceToken: string;
    deviceMnemonic: string;
    connected = false;
    unsubscribe: () => void;

    constructor(deviceToken: string) {
        super('evolu');
        this.evolu = createEvolu(Database, { reloadUrl: '#' /* workaround to disable reload */ });

        this.deviceToken = deviceToken;
        this.deviceMnemonic = deriveMnemonic(this.deviceToken);

        this.owner = this.evolu.getOwner();

        this.unsubscribe = this.evolu.subscribeOwner(() => {
            this.owner = this.evolu.getOwner();
            this.connected = this.deviceMnemonic === this.owner?.mnemonic;

            if (!this.connected) {
                this.connect();
            }
        });
    }

    get clientId() {
        return this.type;
    }

    isConnected() {
        return this.connected;
    }

    connect() {
        if (this.isConnected()) return Promise.resolve(this.ok());

        return parseMnemonic(this.deviceMnemonic)
            .pipe(Effect.runPromiseExit)
            .then(
                Exit.match({
                    onFailure: error => {
                        console.error(JSON.stringify(error, null, 2));
                        this.connected = false;
                        return this.error('OTHER_ERROR', 'Failed to parse mnemonic');
                    },
                    onSuccess: mnemonic => {
                        if (this.owner?.mnemonic && mnemonic !== this.owner?.mnemonic) {
                            this.evolu.restoreOwner(mnemonic);
                            this.connected = true;
                        }
                        return this.ok();
                    },
                }),
            );
    }

    disconnect() {
        this.connected = false;
        return Promise.resolve(this.ok());
    }

    async getFileContent(file: string) {
        const { row } = await this.evolu.loadQuery(
            this.evolu.createQuery(db =>
                db.selectFrom('file').selectAll().where('fileName', '=', file),
            ),
        );
        return this.ok(row?.content ? Buffer.from(row?.content, 'hex') : undefined);
    }

    async setFileContent(file: string, content: Buffer) {
        const { row } = await this.evolu.loadQuery(
            this.evolu.createQuery(db =>
                db.selectFrom('file').select(['id']).where('fileName', '=', file),
            ),
        );
        const hex = content.toString('hex');
        const value = { fileName: file, content: hex };

        if (row?.id) {
            this.evolu.update('file', { id: row.id, value });
        } else {
            this.evolu.create('file', value);
        }
        return this.ok(undefined);
    }

    async getFilesList() {
        const { rows } = await this.evolu.loadQuery(
            this.evolu.createQuery(db => db.selectFrom('file').select(['fileName'])),
        );
        return this.ok(rows?.map(row => row.fileName));
    }

    renameFile() {
        return Promise.resolve(this.ok(undefined));
    }

    // eslint-disable-next-line
    async getProviderDetails() {
        return this.ok({
            type: this.type,
            isCloud: this.isCloud,
            tokens: {
                accessToken: this.owner?.mnemonic || '',
                deviceToken: this.deviceToken,
            },
            user: this.owner?.id || '',
            clientId: this.clientId,
        });
    }
}

export default EvoluProvider;
