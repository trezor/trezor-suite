/**
 * IPC message types for Windows Hello child process communication
 */

export interface IPCRequest {
    id: string;
    method: 'isHelloAvailable' | 'requestHello';
    params?: {
        message?: string;
        windowHandle?: Buffer | null;
    };
}

export interface IPCResponse {
    id: string;
    success: boolean;
    result?: any;
    error?: string;
}

export interface IPCError {
    id: string;
    error: string;
}

export type IPCMessage = IPCRequest | IPCResponse | IPCError;

/**
 * Public API interface that matches the original createWinHello return type
 */
export interface WinHelloAPI {
    isHelloAvailable(): Promise<boolean>;
    requestHello(message?: string, windowHandle?: Buffer | null): Promise<string>;
}

/**
 * Manager interface for the child process
 */
export interface WinHelloManager extends WinHelloAPI {
    create({ resourcesPath }: { resourcesPath: string }): Promise<void>;
    destroy(): Promise<void>;
}
