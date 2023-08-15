import { prepareFirmwareMiddleware } from './firmwareMiddleware';
import { extraDependencies } from '../../support/extraDependencies';

const firmware = prepareFirmwareMiddleware(extraDependencies);
export default [firmware];
