import { EARN_MODULE_PREFIX } from '../constants';

export const getYieldWithdrawFormDraftKey = (flowKey: string) =>
    `${EARN_MODULE_PREFIX}/yield-withdraw/${flowKey}`;
