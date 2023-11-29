/* eslint-disable no-underscore-dangle */

import { AbstractMetadataProvider } from 'src/types/suite/metadata';
import * as S from '@effect/schema/Schema';
import * as Evolu from '@evolu/react';
import * as EvoluCommon from '@evolu/common-react';

const FileId = Evolu.id('File');
type FileId = S.Schema.To<typeof FileId>;

const MetadataTable = S.struct({
    id: FileId,
    fileName: Evolu.String,
    content: Evolu.String,
});
type MetadataTable = S.Schema.To<typeof MetadataTable>;

const Database = S.struct({
    file: MetadataTable,
});

class EvoluProvider extends AbstractMetadataProvider {
    isCloud = true;
    evolu: EvoluCommon.EvoluReact<any>;

    constructor() {
        super('evolu');
        console.log('init evolu provider');
        this.evolu = Evolu.create(Database);
        console.log('evolu', this.evolu);
    }

    get clientId() {
        return this.type;
    }

    isConnected() {
        return true;
    }

    connect() {
        return Promise.resolve(this.ok());
    }

    disconnect() {
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
        const owner = this.evolu.getOwner();
        return this.ok({
            type: this.type,
            isCloud: this.isCloud,
            tokens: {
                accessToken: owner?.mnemonic || '',
            },
            user: owner?.id || '',
            clientId: this.clientId,
        });
    }
}

export default EvoluProvider;
