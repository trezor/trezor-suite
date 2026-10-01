import { useContext } from 'react';

import { throwError } from '@trezor/utils';

import { WrapStepWarningsContext } from '../WrapStepWarningsContext';

export const useWrapStepWarningsContext = () =>
    useContext(WrapStepWarningsContext) ??
    throwError('WrapStepWarningsContext used without Context');
