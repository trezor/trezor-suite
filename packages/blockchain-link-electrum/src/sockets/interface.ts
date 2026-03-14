export type SocketListener = {
    onConnect: () => void;
    onReceive: (e: string) => void;
    onClose: (e: unknown) => void;
    onEnd: (e: unknown) => void;
    onError: (e: unknown) => void;
};

export interface ISocket {
    connect(listener: SocketListener): Promise<void>;
    close(): void;
    send(data: string): void;
}
