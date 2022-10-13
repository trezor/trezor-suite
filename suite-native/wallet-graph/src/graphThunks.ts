import { getUnixTime } from 'date-fns';

import { createThunk } from '@suite-common/redux-utils';
import { getBlockbookSafeTime, getDatesInMinuteSpacedInterval } from '@suite-common/suite-utils';
import TrezorConnect from '@trezor/connect';
import { Account } from '@suite-common/wallet-types';
import { getFiatRatesForTimestamps } from '@suite-common/fiat-services';

import { actionPrefix, graphActions } from './graphActions';

export interface GraphDataRequest {
    section: 'dashboard' | 'account';
    stepInMinutes: number;
    startOfRangeDate: Date;
    endOfRangeDate: Date;
    accounts: Account[];
}

export const getGraphDataForAccounts = createThunk(
    `${actionPrefix}/getGraphData`,
    async (requestData: GraphDataRequest, { dispatch }) => {
        const { section, accounts, startOfRangeDate, endOfRangeDate, stepInMinutes } = requestData;

        const bitcoinAccounts = accounts.filter(account => account.symbol === 'btc');

        const datesInRange = getDatesInMinuteSpacedInterval(
            startOfRangeDate,
            endOfRangeDate,
            stepInMinutes,
        );
        const datesInRangeUnixTime = datesInRange.map(date =>
            getBlockbookSafeTime(getUnixTime(date)),
        );

        const ratesForDatesInRange = await getFiatRatesForTimestamps(
            { symbol: 'btc' },
            datesInRangeUnixTime,
        )
            .then(res => (res?.tickers || []).map(({ ts, rates }) => [ts, rates]))
            .then(res => Object.fromEntries(res));

        // TODO these are graph points
        const mappedDatesInRange = Object.keys(ratesForDatesInRange).map(timestamp => {
            const fiatRates = ratesForDatesInRange[timestamp];
            return {
                date: new Date(Number(timestamp) * 1000),
                value: Math.floor(fiatRates.usd),
            };
        });

        const promises = bitcoinAccounts.map(async account => {
            const response = await TrezorConnect.blockchainGetAccountBalanceHistory({
                coin: 'btc',
                descriptor: account.descriptor,
                // from: getBlockbookSafeTime(getUnixTime(startOfRangeDate)), // TODO
                to: getBlockbookSafeTime(getUnixTime(endOfRangeDate)),
                groupBy: stepInMinutes * 60,
            });
            try {
                if (response?.success) {
                    /*
                    const { payload } = response;

                    "payload":[
                    {
                    "time":1421195400,
                    "txs":2,
                    "received":"100000",
                    "sent":"100000",
                    "sentToSelf":"0",
                    "rates":{
                    */

                    // TODO merge all together
                    dispatch(
                        graphActions.updateGraphPoints({
                            section,
                            points: mappedDatesInRange,
                        }),
                    );
                }
            } catch (error) {
                // eslint-disable-next-line no-console
                console.log(error);
            }
        });
        await Promise.all(promises);
    },
);
