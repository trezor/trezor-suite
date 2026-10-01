import { useContext } from 'react';

import { throwError } from '@trezor/utils';

import { ApproveStepWarningsContext } from '../ApproveStepWarningsContext';

export const useApproveStepWarningsContext = () =>
    useContext(ApproveStepWarningsContext) ??
    throwError('ApproveStepWarningsContext used without Context');
