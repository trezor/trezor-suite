//{
//     fiatCurrency: 'USD',
//     rewardAmount: 20,
//     minimumOrderAmount: 49,
//     friendDiscountPercentage: 10,
//     annualReferralLimit: 50,
//     annualRewardLimit: 1000,
//     rewardWaitingPeriodDays: 30,
//     referralLink: 'https://trezor.io/ref/a3k9x2m7',
//     nextResetDate: '2027-08-31',
//     voucherExpirationDate: '2027-08-31',
// }
// TODO: get the value from BE
export const useReferAFriend = () => ({
    rewardAmount: '$20',
    rewardWaitingPeriodDays: 30,
    minimumOrderAmount: '$49',
    friendDiscountPercentage: 10,
    annualReferralLimit: 50,
    annualRewardLimit: '$1,000',
});
