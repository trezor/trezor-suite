import type { ContextType } from '../baseWorker';
import type { BlockbookAPI } from './websocket';

export type Context = ContextType<BlockbookAPI>;

export type Request<T> = T & Context;
