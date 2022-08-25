import { createAction } from '@reduxjs/toolkit';
import { getUnixTime, subWeeks, differenceInMilliseconds } from 'date-fns';

import {
    fetchCurrentFiatRates,
    getFiatRatesForTimestamps,
    fetchLastWeekRates,
    fetchCurrentTokenFiatRates,
} from '@suite-common/suite-services';
import TrezorConnect, { AccountTransaction, BlockchainFiatRatesUpdate } from '@trezor/connect';
import { isTestnet, getAccountTransactions } from '@suite-common/wallet-utils';
import { getBlockbookSafeTime } from '@suite-common/suite-utils';
