import { EARN_MODULE_PREFIX } from '../constants';

export const getYieldDepositFormDraftKey = (flowKey: string) =>
    `${EARN_MODULE_PREFIX}/yield-deposit/${flowKey}`;
