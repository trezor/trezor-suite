/* @flow
 * Type definitions for bitcoinjs-lib
 */

declare module 'bitcoinjs-lib' {

    declare type Network = {
        messagePrefix: string;
        bip32: {
            public: number;
            private: number;
        };
        pubKeyHash: number;
        scriptHash: number;
        wif: number;
        dustThreshold: number;
        feePerKB: number;
    }

    declare type Input = {
        script: Buffer;
        hash: Buffer;
        index: number;
        sequence: number;
    };

    declare type Output = {
        script: Buffer;
        value: number;
    };

    declare var address: {
        fromBase58Check(address: string): {hash: Buffer, version: number};
        fromOutputScript(scriptPubKey: Buffer, network?: Network): string;
        toBase58Check(hash: Buffer, version: number): string;
        toOutputScript(address: string, network?: Network): string;
    };

    declare var script: {
        fromAddress(address: string, network?: Network): Buffer;
        pubKeyHashOutput(pkh: Buffer): Buffer;
        scriptHashOutput(sho: Buffer): Buffer;
    };

    declare class ECPair {
        d: ?Buffer;
        Q: ?Buffer;
        constructor(d: ?Buffer, Q: ?Buffer): void;
        getPublicKeyBuffer(): Buffer;
    }

    declare class HDNode {
        depth: number;
        parentFingerprint: number;
        index: number;
        keyPair: ECPair;
        chainCode: Buffer;
        static fromBase58(
            str: string,
            networks: Array<Network> | Network
        ): HDNode;
        derive(index: number): HDNode;
        toBase58(): string;
        getAddress(): string;
        constructor(keyPair: ECPair, chainCode: Buffer): void;
    }

    declare class Transaction {
        version: number;
        locktime: number;

        constructor(): void;
        static fromHex(hex: string): Transaction;
        ins: Array<Input>;
        outs: Array<Output>;
        toHex(): string;
        static isCoinbaseHash(buffer: Buffer): boolean;
    }

    declare var networks: {[key: string]: Network}
}
