// Todo: scrapyard of code, TBD: we need to figure out something like "master Trezor" or some other solution to this problem

// import { CurrencyCode } from "@evolu/common"
// import { SettingsId } from '../schema';
// import { FiatCurrencyCode } from '@suite-common/suite-config';
//
// const SETTINGS_ID = getOrThrow(SettingsId.from('jWCyU0803P2pRhFWkRHki')); // There is always only one settings record/row
//
// onFiatSettingsChange: (payload: { localCurrency: FiatCurrencyCode }) => void;
// };

// updateSettingsFiat = ({ code }: UpdateSettingsFiatParams) => {
//     // Todo: replace getOrThrow wit some nice error propagation
//     const result = getOrThrow(
//         this.evolu.upsert('settings', {
//             id: SETTINGS_ID,
//             fiat: getOrThrow(CurrencyCode.from(code.toUpperCase())),
//         }),
//     );
//
//     console.log('____updateSettingsFiat::result', result);
// };

//
// private getSettingsQuery = () =>
//     this.evolu.createQuery(db =>
//         db.selectFrom('settings').where('id', '=', SETTINGS_ID).selectAll(),
//     );
//
// subscribeSettings = (listener: StorageSettingsListener) => {
//     const settingsQuery = this.getSettingsQuery();
//
//     const processSettings = (settings: QueryRows<UnwrapQuery<typeof settingsQuery>>) => {
//         if (settings[0] && settings[0].fiat) {
//             listener.onFiatSettingsChange({
//                 localCurrency: settings[0].fiat.toLowerCase() as FiatCurrencyCode,
//             });
//         }
//     };
//
//     this.evolu.subscribeQuery(settingsQuery)(() => {
//         const settings = this.evolu.getQueryRows(settingsQuery);
//         processSettings(settings);
//     });
//     this.evolu.loadQuery(settingsQuery).then(processSettings);
// };

// export const SettingsId = id('Settings');
// export type SettingsId = typeof SettingsId.Type;

// settings: {
//     id: SettingsId,
//         fiat: CurrencyCode,
// },

// import { CurrencyCode, Evolu, Query, QueryRows, getOrThrow } from '@evolu/common';
//
// import { FiatCurrencyCode } from '@suite-common/suite-config';
// type UpdateSettingsFiatParams = {
//     code: FiatCurrencyCode;
// };
