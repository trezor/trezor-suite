import { typedObjectKeys } from '@trezor/utils/src/typedObject';

export type CardanoProtocolParams = {
    minFeeA: string;
    minFeeB: string;
    keyDeposit: string;
    poolDeposit: string;
    coinsPerUtxoByte: string;
    maxValueSize: number;
    maxTxSize: number;
};

export const DEFAULT_CARDANO_PROTOCOL_PARAMS: CardanoProtocolParams = {
    minFeeA: '44',
    minFeeB: '155381',
    keyDeposit: '2000000',
    poolDeposit: '500000000',
    coinsPerUtxoByte: '4310',
    maxValueSize: 5000,
    maxTxSize: 16384,
};

export const resolveProtocolParams = (
    protocolParams?: Partial<CardanoProtocolParams>,
): CardanoProtocolParams => ({ ...DEFAULT_CARDANO_PROTOCOL_PARAMS, ...protocolParams });

export type ProtocolParamDrift = {
    param: keyof CardanoProtocolParams;
    live: string | number;
    compiled: string | number;
};

export const getProtocolParamsDrift = (
    liveParams: Partial<CardanoProtocolParams>,
): ProtocolParamDrift[] =>
    typedObjectKeys(liveParams)
        .map(param => ({
            param,
            live: liveParams[param],
            compiled: DEFAULT_CARDANO_PROTOCOL_PARAMS[param],
        }))
        .filter(
            (entry): entry is ProtocolParamDrift =>
                entry.live !== undefined && String(entry.live) !== String(entry.compiled),
        );
