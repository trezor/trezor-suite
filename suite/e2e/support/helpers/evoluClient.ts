/* eslint-disable no-console */
import { Evolu, SimpleName, createIdFromString, getOrThrow, id } from '@evolu/common';
import { createEvolu, createOwnerWebSocketTransport } from '@evolu/common/local-first';

import { Schema, createEvoluAppOwnerFromTrezorData } from '@suite-common/suite-sync-evolu';
import { SuiteSyncOwnerSecretHex } from '@suite-common/suite-types';

import { createNodeEvoluDeps } from './createEvoluNodeDeps';
import { expect } from '../../support/fixtures';

export class EvoluClient {
    private _evolu?: Evolu<typeof Schema>;

    async init({
        ownerSecret,
        //TODO: replace with one source definition
        relayUrl = 'http://localhost:4000',
    }: {
        ownerSecret: SuiteSyncOwnerSecretHex;
        relayUrl?: string;
    }) {
        const { deps } = await createNodeEvoluDeps();

        const owner = createEvoluAppOwnerFromTrezorData({ data: ownerSecret });
        if (!owner.ok) {
            throw new Error(`Failed to parse owner: ${JSON.stringify(owner.error)}`);
        }

        //db name just on client side
        //TODO: I think it is not used not at all because of how deps are created
        const sanitizedOwnerId = owner.value.id.replaceAll('_', '-');
        const databaseName = getOrThrow(SimpleName.from(`trezor-suite-e2e-${sanitizedOwnerId}`));

        this._evolu = createEvolu(deps)(Schema, {
            name: databaseName,
            transports: [
                createOwnerWebSocketTransport({
                    url: relayUrl,
                    ownerId: owner.value.id,
                }),
            ],
            externalAppOwner: owner.value,
            // This turns on the Encryption-at-rest (encryption of the SQLLite file),
            encryptionKey: owner.value.encryptionKey,
        });

        this._evolu.subscribeError(() => {
            console.error('Evolu Error:', this._evolu?.getError());
        });
    }

    get evolu() {
        if (!this._evolu) {
            throw new Error('EvoluClient not initialized. Call init() first.');
        }

        return this._evolu;
    }

    //TMP
    async getAccountData() {
        const accountData = await this.evolu.loadQuery(
            this.evolu.createQuery(db => db.selectFrom('account').selectAll()),
        );
        const error = this.evolu.getError();
        if (error) {
            console.error('Evolu Error detected during wait:', error);
        }

        return accountData;
    }

    //TMP
    async testWriteAndRead() {
        this.writeTestData();
        await this.readTestData();
    }

    //TMP
    writeTestData() {
        // Insert a wallet label
        const WalletLabelId = id('WalletLabelId');
        const walletDescriptor = 'xpub6D1weXBcFAo8CqBbpP4TbH5sxQH8ZkqC5pDEvJ95rNNBZC9zTXPD';
        const walletIdResult = WalletLabelId.from(createIdFromString(walletDescriptor));
        if (!walletIdResult.ok) {
            throw walletIdResult.error;
        }
        const upsertResult = this.evolu.upsert('wallet', {
            id: walletIdResult.value,
            walletDescriptor,
            label: 'My Test Wallet',
        });
        if (!upsertResult.ok) {
            console.error('Upsert failed:', upsertResult.error);
            throw upsertResult.error;
        }
    }

    //TMP
    async readTestData() {
        // Get and log the wallet data to verify
        await expect(async () => {
            const walletData = await this.evolu.loadQuery(
                this.evolu.createQuery(db => db.selectFrom('wallet').selectAll()),
            );
            console.log('Wallet data:', walletData);

            expect(walletData).not.toEqual([]);
            console.error('Wallet data from Evolu:', JSON.stringify(walletData));
        }).toPass({ timeout: 30_000 });
    }
}
