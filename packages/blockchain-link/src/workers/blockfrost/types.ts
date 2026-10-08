import type { ContextType } from '../baseWorker';
import type { BlockfrostAPI } from './websocket';

export type Context = ContextType<BlockfrostAPI>;

export type Request<T> = T & Context;
