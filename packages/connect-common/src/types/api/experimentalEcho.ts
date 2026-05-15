import type { CommonParams, Response } from '../params';

export type ExperimentalEchoParams = CommonParams & {
    message: string;
};

export type ExperimentalEchoResult = {
    echo: string;
    receivedAt: number;
};

export declare function experimentalEcho(
    params: ExperimentalEchoParams,
): Response<ExperimentalEchoResult>;
