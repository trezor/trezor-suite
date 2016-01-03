/* @flow
 * Type definitions for bitcoinjs-lib
 */

type Network = {
    pubKeyHash: number;
    scriptHash: number;
    dustThreshold: number;
    feePerKB: number;
};

type Input = {
    script: Buffer;
    hash: Buffer;
    id: string;
    index: number;
    sequence: number;
};

type Output = {
    address: ?string;
    script: Buffer;
    value: number;
};

declare module 'bitcoinjs-lib' {

    declare var address: {
        fromOutputScript(script: Buffer): string;
    };

    declare var script: {
        fromAddress(address: string): Buffer;
    };

    declare class HDNode {
        static fromBase58(
            str: string,
            networks: Array<Network> | Network
        ): HDNode;
        derive(index: number): HDNode;
        toBase58(): string;
    }

    declare class Transaction {
        static fromHex(hex: string): Transaction;
        ins: Array<Input>;
        outs: Array<Output>;
        toHex(): string;
    }
}