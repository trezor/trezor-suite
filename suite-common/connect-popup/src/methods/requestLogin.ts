import { type ConnectPopupMethodDefinition, type PreCallParams } from './types';

const preCall = ({ payload, source }: PreCallParams<'requestLogin'>) => ({
    ...payload,
    origin: source.origin,
});

export const requestLogin: ConnectPopupMethodDefinition<'requestLogin'> = {
    preCall,
};
