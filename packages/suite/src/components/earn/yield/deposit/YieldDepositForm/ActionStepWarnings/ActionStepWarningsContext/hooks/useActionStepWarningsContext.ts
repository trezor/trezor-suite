import { useContext } from 'react';

import { throwError } from '@trezor/utils';

import { ActionStepWarningsContext } from '../ActionStepWarningsContext';

export const useActionStepWarningsContext = () =>
    useContext(ActionStepWarningsContext) ??
    throwError('ActionStepWarningsContext used without Context');
