import { createAction } from '@reduxjs/toolkit';

import { type Account } from '@suite-common/wallet-types';

export const mockSetAccountAddMetadata = () =>
    createAction('mock/setAccountAddMetadata', (payload: Account) => ({ payload }));
