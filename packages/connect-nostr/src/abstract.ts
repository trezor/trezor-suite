import { TypedEmitter } from '@trezor/utils';

export type PeerToPeerEvent = { content: string; timestamp: number; pubKey: string };

export interface PeerToPeerCommunicationClientEvents {
    event: PeerToPeerEvent;
    status: 'connecting' | 'connected' | 'disconnected';
}

export abstract class PeerToPeerCommunicationClient<
    T extends PeerToPeerCommunicationClientEvents,
> extends TypedEmitter<T> {
    abstract connect(): Promise<void>;
    abstract send({
        content,
    }: {
        content: string;
    }): Promise<{ success: false; error: string } | { success: true }>;
    abstract subscribe({ pubKeys }: { pubKeys: string[] }): void;
    abstract dispose(): Promise<void>;
}
