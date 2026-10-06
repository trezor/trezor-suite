/**
 * IPC message types for Windows Hello child process communication
 */

export interface IPCRequest {
    id: string;
    method: 'isHelloAvailable' | 'requestHello';
    params?: {
        message?: string;
    };
}

export interface IPCISHelloAvailableSuccessResponse {
    id: string;
    success: true;
    result: boolean;
}

export interface IPCRequestHelloSuccessResponse {
    id: string;
    success: true;
    result: string;
}

export interface IPCErrorResponse {
    id: string;
    success: false;
    error: string;
}

export type IPCResponse =
    IPCISHelloAvailableSuccessResponse | IPCRequestHelloSuccessResponse | IPCErrorResponse;

export interface IPCReadyMessage {
    ready: true;
}

/**
 * Logger interface
 */
export interface Logger {
    info: (topic: string, message: string) => void;
}

/**
 * Manager creation options
 */
export interface WinHelloManagerOptions {
    resourcesPath: string;
    logger: Logger;
}

/**
 * Public API interface that matches the original createWinHello return type
 */
export interface WinHelloAPI {
    isHelloAvailable(): Promise<boolean>;
    requestHello(message?: string): Promise<string>;
}

/**
 * Manager interface for the child process
 */
export interface WinHelloManager extends WinHelloAPI {
    create({ resourcesPath }: { resourcesPath: string }): Promise<void>;
    destroy(): Promise<void>;
}
