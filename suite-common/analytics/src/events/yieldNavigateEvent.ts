import type { EarnModalAction } from '@suite-common/suite-types';

import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    action: AttributeDef<EarnModalAction>;
    from: AttributeDef<
        | 'earn-dashboard'
        | 'account-banner'
        | 'asset-detail-banner'
        | 'account-tokens'
        | 'account-defi-tokens'
        | 'account-tradebox'
        | 'deposit-in-a-nutshell-modal'
        | 'deposit-legal-modal'
        | 'claim-select-account-modal'
        | 'deposit-form'
        | 'withdraw-form'
        | 'claim-form'
        | 'wrap-form'
        | 'unwrap-form'
        | 'choose-account-sheet'
        | 'enable-network-sheet'
        | 'account-detail'
        | 'vault-detail'
        | 'insufficient-balance-screen'
    >;
    to: AttributeDef<
        | 'earn-dashboard'
        | 'deposit-form'
        | 'withdraw-form'
        | 'claim-form'
        | 'wrap-form'
        | 'unwrap-form'
        | 'deposit-in-a-nutshell-modal'
        | 'deposit-legal-modal'
        | 'claim-select-account-modal'
        | 'choose-account-sheet'
        | 'enable-network-sheet'
        | 'account-detail'
        | 'vault-detail'
        | 'insufficient-balance-screen'
    >;
    networkSymbol?: AttributeDef<string>;
    vaultId?: AttributeDef<string>;
};

export const yieldNavigateEvent: EventDef<Attributes, EventType.YieldNavigate> = {
    name: EventType.YieldNavigate,
    descriptionTrigger: 'fired when the user navigates between stablecoin yield sections',
    changelog: [
        { version: '26.5.0', notes: 'added' },
        { version: '26.7.1', notes: 'moved to suite-common, reported from mobile as well' },
        {
            version: '26.11.0',
            notes: 'Aligned exit handling and tracked skipped onboarding; info-only education does not emit funnel navigation.',
        },
        {
            version: '26.11.0',
            notes: 'Mobile account and network activation entries identify their origin. Entry sheets report opening and cancellation once; selecting an account or continuing network activation does not report cancellation. Claim account selection uses the same steps as desktop. Approval and in-flow wrap/unwrap exits belong to their parent form, including when a transaction is pending. Returning from revoke to approval stays within the deposit flow.',
        },
    ],

    attributes: {
        action: {
            description:
                'User action: `continue` to proceed to the destination, `cancel` when the user leaves without continuing',
            changelog: [{ version: '26.5.0', notes: 'added' }],
        },
        from: {
            description:
                'Origin of the navigation. On mobile, `deposit-in-a-nutshell-modal` = How yield works screen, `deposit-legal-modal` = consents screen and `claim-select-account-modal` = claim account sheet (named after their desktop counterparts); `choose-account-sheet`, `enable-network-sheet`, `account-detail` and `insufficient-balance-screen` are mobile-only as an origin, `account-defi-tokens` is desktop-only; `account-tokens` = yield badge on the account Tokens tab or the token row actions there, `account-defi-tokens` also covers the yield badge and token row actions on the DeFi tab, `account-tradebox` = yield badge or Earn button in the account trade box, `asset-detail-banner` = ETH or token yield banner on the Home asset detail on desktop, token yield banner on the asset detail on mobile',
            changelog: [
                { version: '26.5.0', notes: 'added' },
                {
                    version: '26.7.1',
                    notes: 'added `choose-account-sheet`, `account-detail`, `insufficient-balance-screen` values (mobile)',
                },
                {
                    version: '26.8.0',
                    notes: 'added `account-tokens`, `account-tradebox` values, and `wrap-form`, `unwrap-form` values (desktop)',
                },
                {
                    version: '26.8.1',
                    notes: '`wrap-form` / `unwrap-form` reported from mobile as well',
                },
                {
                    version: '26.11.0',
                    notes: 'added `asset-detail-banner` value',
                },
                {
                    version: '26.11.0',
                    notes: 'Added enable-network-sheet on mobile; claim-select-account-modal is now shared with mobile.',
                },
            ],
        },
        to: {
            description:
                'Navigation destination, including automatic onboarding skips. Mobile network activation uses enable-network-sheet; dismissing an entry sheet returns to earn-dashboard. Deposit, withdrawal and claim exits return to earn-dashboard on both platforms. Standalone wrap/unwrap exits use `account-detail`.',
            changelog: [
                { version: '26.5.0', notes: 'added' },
                {
                    version: '26.7.1',
                    notes: 'added `choose-account-sheet`, `account-detail`, `insufficient-balance-screen` values (mobile)',
                },
                {
                    version: '26.8.0',
                    notes: 'added `wrap-form` and `unwrap-form` values, and `account-detail` is now also reported (desktop)',
                },
                {
                    version: '26.8.0',
                    notes: 'added `vault-detail` value (mobile)',
                },
                {
                    version: '26.8.1',
                    notes: '`wrap-form` / `unwrap-form` reported from mobile as well',
                },
                {
                    version: '26.11.0',
                    notes: 'Added enable-network-sheet on mobile; claim-select-account-modal is now shared with mobile.',
                },
            ],
        },
        networkSymbol: {
            changelog: [{ version: '26.5.0', notes: 'added' }],
        },
        vaultId: {
            description: 'Internal vault identifier (vault.id), unique per Morpho vault',
            changelog: [
                { version: '26.5.2', notes: 'added' },
                {
                    version: '26.11.0',
                    notes: 'Mobile active-position navigation includes the selected vault ID.',
                },
            ],
        },
    },
};
