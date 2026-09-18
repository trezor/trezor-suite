import { type Feature, type Message, type TrezorDevice } from '@suite-common/suite-types';
import { networksCollection } from '@suite-common/wallet-config';
import { DeviceModelInternal } from '@trezor/device-utils';
import { BigNumber } from '@trezor/utils';

import { Feature as MessageSystemFeature } from './messageSystemTypes';

export const promoBannerIds = ['ts7', 'defi-yield', 'eth-vault'] as const;
export type PromoBannerId = (typeof promoBannerIds)[number];

export const promoBannerPlatforms = ['desktop', 'web', 'ios', 'android'] as const;
export type PromoBannerPlatform = (typeof promoBannerPlatforms)[number];

export const promoBannerPlacements = ['dashboard', 'home'] as const;
export type PromoBannerPlacement = (typeof promoBannerPlacements)[number];

export const promoBannerConditionTypes = [
    'physical-trezor-connected',
    'portfolio-tracker-only',
    'device-capability',
    'device-model',
    'device-model-not',
    'asset-balance-positive',
    'asset-balance-none',
    'product-position-positive',
    'product-position-none',
] as const;
export type PromoBannerConditionType = (typeof promoBannerConditionTypes)[number];

export type PromoBannerCondition =
    | {
          type: 'physical-trezor-connected';
      }
    | {
          type: 'portfolio-tracker-only';
          value: boolean;
      }
    | {
          type: 'device-capability' | 'device-model' | 'device-model-not';
          value: string;
      }
    | {
          type:
              | 'asset-balance-positive'
              | 'asset-balance-none'
              | 'product-position-positive'
              | 'product-position-none';
          value: string;
      };

export type PromoBannerEligibility = {
    required: PromoBannerCondition[];
    alternatives: PromoBannerCondition[][];
};

export type PromoBannerCarouselOrder = {
    platform: PromoBannerPlatform;
    placement: PromoBannerPlacement;
    value: number;
};

export type PromoBannerFeatureConfig = {
    bannerId: PromoBannerId;
    isEnabled: boolean;
    carouselOrder: PromoBannerCarouselOrder[];
    eligibility: PromoBannerEligibility;
};

type PromoBannerAccount = {
    balance: string;
    networkType: string;
    symbol: string;
    misc?: Record<string, unknown>;
    tokens?: Array<{
        balance?: string;
        contract?: string;
    }>;
};

type ParsedPromoBannerAssetId =
    | {
          type: 'native';
          networkSymbol: string;
      }
    | {
          type: 'token';
          networkSymbol: string;
          tokenId: string;
      };

type ParsedPromoBannerProductId =
    | {
          type: 'staking';
          networkSymbol: string;
      }
    | {
          type: 'yield';
          networkSymbol: string;
          tokenId: string;
      };

type ParsePromoBannerFeatureResult = {
    errors: string[];
    promoBanner: PromoBannerFeatureConfig | null;
};

type ParsePromoBannerMessagesResult = {
    errors: string[];
    promoBanners: PromoBannerFeatureConfig[];
};

type SelectEligiblePromoBannersParams = {
    promoBanners: PromoBannerFeatureConfig[];
    platform: PromoBannerPlatform;
    placement: PromoBannerPlacement;
    accounts: PromoBannerAccount[];
    isWalletDiscoveryFinished: boolean;
    isPortfolioTrackerOnly: boolean;
    selectedDevice: TrezorDevice | null | undefined;
    reportError?: (message: string) => void;
};

type EvaluatePromoBannerConditionParams = Pick<
    SelectEligiblePromoBannersParams,
    'accounts' | 'isPortfolioTrackerOnly' | 'isWalletDiscoveryFinished' | 'selectedDevice'
>;

const knownNetworkSymbols = new Set<string>(networksCollection.map(network => network.symbol));
const knownDeviceModels = new Set<string>(Object.values(DeviceModelInternal));

const isPromoBannerId = (value: unknown): value is PromoBannerId =>
    typeof value === 'string' && promoBannerIds.includes(value as PromoBannerId);

const isPromoBannerPlatform = (value: unknown): value is PromoBannerPlatform =>
    typeof value === 'string' && promoBannerPlatforms.includes(value as PromoBannerPlatform);

const isPromoBannerPlacement = (value: unknown): value is PromoBannerPlacement =>
    typeof value === 'string' && promoBannerPlacements.includes(value as PromoBannerPlacement);

const isPromoBannerConditionType = (value: unknown): value is PromoBannerConditionType =>
    typeof value === 'string' &&
    promoBannerConditionTypes.includes(value as PromoBannerConditionType);

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const isNonEmptyString = (value: unknown): value is string =>
    typeof value === 'string' && value.trim() !== '';

const isWalletDependentPromoBannerCondition = (
    condition: PromoBannerCondition,
): condition is Extract<
    PromoBannerCondition,
    {
        type:
            | 'asset-balance-positive'
            | 'asset-balance-none'
            | 'product-position-positive'
            | 'product-position-none';
    }
> =>
    condition.type === 'asset-balance-positive' ||
    condition.type === 'asset-balance-none' ||
    condition.type === 'product-position-positive' ||
    condition.type === 'product-position-none';

const getPromoBannerAssetId = (value: string): ParsedPromoBannerAssetId | null => {
    const [type, networkSymbol, tokenId, extra] = value.split(':');

    if (!networkSymbol || !knownNetworkSymbols.has(networkSymbol)) {
        return null;
    }

    if (type === 'native' && tokenId === undefined && extra === undefined) {
        return {
            type,
            networkSymbol,
        };
    }

    if (type === 'token' && isNonEmptyString(tokenId) && extra === undefined) {
        return {
            type,
            networkSymbol,
            tokenId: tokenId.toLowerCase(),
        };
    }

    return null;
};

const getPromoBannerProductId = (value: string): ParsedPromoBannerProductId | null => {
    const [type, networkSymbol, tokenId, extra] = value.split(':');

    if (!networkSymbol || !knownNetworkSymbols.has(networkSymbol)) {
        return null;
    }

    if (type === 'staking' && tokenId === undefined && extra === undefined) {
        return {
            type,
            networkSymbol,
        };
    }

    if (type === 'yield' && isNonEmptyString(tokenId) && extra === undefined) {
        return {
            type,
            networkSymbol,
            tokenId: tokenId.toLowerCase(),
        };
    }

    return null;
};

const getPromoBannerCondition = (
    condition: unknown,
): { condition?: PromoBannerCondition; error?: string } => {
    if (!isObject(condition)) {
        return {
            error: 'Unsupported promo banner condition type.',
        };
    }

    const { type, value } = condition;

    if (!isPromoBannerConditionType(type)) {
        return {
            error: 'Unsupported promo banner condition type.',
        };
    }

    if (type === 'physical-trezor-connected') {
        if (value !== undefined) {
            return {
                error: 'Promo banner condition "physical-trezor-connected" must not define a value.',
            };
        }

        return {
            condition: { type },
        };
    }

    if (type === 'portfolio-tracker-only') {
        if (typeof value !== 'boolean') {
            return {
                error: 'Promo banner condition "portfolio-tracker-only" requires a boolean value.',
            };
        }

        return {
            condition: { type, value },
        };
    }

    if (!isNonEmptyString(value)) {
        return {
            error: `Promo banner condition "${type}" requires a value.`,
        };
    }

    if ((type === 'device-model' || type === 'device-model-not') && !knownDeviceModels.has(value)) {
        return {
            error: `Promo banner condition "${type}" references an unknown device model "${value}".`,
        };
    }

    if (
        (type === 'asset-balance-positive' || type === 'asset-balance-none') &&
        !getPromoBannerAssetId(value)
    ) {
        return {
            error: `Unknown promo banner asset identifier "${value}".`,
        };
    }

    if (
        (type === 'product-position-positive' || type === 'product-position-none') &&
        !getPromoBannerProductId(value)
    ) {
        return {
            error: `Unknown promo banner product-position identifier "${value}".`,
        };
    }

    return {
        condition: {
            type,
            value,
        },
    };
};

const getPromoBannerConditions = (
    conditions: unknown,
): { conditions: PromoBannerCondition[]; errors: string[] } => {
    if (conditions === undefined) {
        return {
            conditions: [],
            errors: [],
        };
    }

    if (!Array.isArray(conditions)) {
        return {
            conditions: [],
            errors: ['Promo banner eligibility conditions must be arrays.'],
        };
    }

    return conditions.reduce<{ conditions: PromoBannerCondition[]; errors: string[] }>(
        (accumulator, currentCondition) => {
            const { condition, error } = getPromoBannerCondition(currentCondition);

            if (error) {
                return {
                    ...accumulator,
                    errors: [...accumulator.errors, error],
                };
            }

            if (!condition) {
                return accumulator;
            }

            return {
                ...accumulator,
                conditions: [...accumulator.conditions, condition],
            };
        },
        { conditions: [], errors: [] },
    );
};

const getPromoBannerEligibility = (
    eligibility: unknown,
): { eligibility: PromoBannerEligibility; errors: string[] } => {
    const emptyEligibility: PromoBannerEligibility = {
        required: [],
        alternatives: [],
    };

    if (eligibility === undefined) {
        return {
            eligibility: emptyEligibility,
            errors: [],
        };
    }

    if (!isObject(eligibility)) {
        return {
            eligibility: emptyEligibility,
            errors: ['Promo banner eligibility must be an object.'],
        };
    }

    const requiredResult = getPromoBannerConditions(eligibility.required);
    const rawAlternatives = eligibility.alternatives;

    if (rawAlternatives !== undefined && !Array.isArray(rawAlternatives)) {
        return {
            eligibility: emptyEligibility,
            errors: [
                ...requiredResult.errors,
                'Promo banner alternatives must be an array of condition arrays.',
            ],
        };
    }

    const alternatives = (rawAlternatives ?? []).reduce<PromoBannerCondition[][]>(
        (parsedAlternatives, rawAlternative) => {
            const { conditions } = getPromoBannerConditions(rawAlternative);

            return [...parsedAlternatives, conditions];
        },
        [],
    );
    const alternativeErrors = (rawAlternatives ?? []).flatMap(
        rawAlternative => getPromoBannerConditions(rawAlternative).errors,
    );
    const hasEmptyAlternative = alternatives.some(alternative => alternative.length === 0);

    return {
        eligibility: {
            required: requiredResult.conditions,
            alternatives,
        },
        errors: [
            ...requiredResult.errors,
            ...alternativeErrors,
            ...(hasEmptyAlternative ? ['Promo banner alternatives must not be empty.'] : []),
        ],
    };
};

const getPromoBannerCarouselOrder = (
    carouselOrder: unknown,
): { carouselOrder: PromoBannerCarouselOrder[]; errors: string[] } => {
    if (!Array.isArray(carouselOrder) || carouselOrder.length === 0) {
        return {
            carouselOrder: [],
            errors: ['Promo banner carouselOrder is required.'],
        };
    }

    return carouselOrder.reduce<{ carouselOrder: PromoBannerCarouselOrder[]; errors: string[] }>(
        (accumulator, currentCarouselOrder) => {
            if (!isObject(currentCarouselOrder)) {
                return {
                    ...accumulator,
                    errors: [...accumulator.errors, 'Invalid promo banner carouselOrder entry.'],
                };
            }

            const { platform, placement, value } = currentCarouselOrder;

            if (!isPromoBannerPlatform(platform) || !isPromoBannerPlacement(placement)) {
                return {
                    ...accumulator,
                    errors: [
                        ...accumulator.errors,
                        'Invalid promo banner carouselOrder placement or platform.',
                    ],
                };
            }

            if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
                return {
                    ...accumulator,
                    errors: [...accumulator.errors, 'Invalid promo banner carouselOrder value.'],
                };
            }

            return {
                ...accumulator,
                carouselOrder: [...accumulator.carouselOrder, { platform, placement, value }],
            };
        },
        { carouselOrder: [], errors: [] },
    );
};

export const getPromoBannerFeatureValidationErrors = (feature: Feature): string[] => {
    if (feature.domain !== MessageSystemFeature.banners.dashboard.promo) {
        return [];
    }

    if (!isObject(feature.payload)) {
        return ['Promo banner payload is required.'];
    }

    const bannerId = feature.payload.bannerId ?? feature.visibleBanner;
    const carouselOrderResult = getPromoBannerCarouselOrder(feature.payload.carouselOrder);
    const eligibilityResult = getPromoBannerEligibility(feature.payload.eligibility);

    if (!isPromoBannerId(bannerId)) {
        return [
            `Unknown promo banner id "${bannerId ?? ''}".`,
            ...carouselOrderResult.errors,
            ...eligibilityResult.errors,
        ];
    }

    const duplicatePlacementOrders = new Set<string>();
    const duplicatePlacementOrderErrors = carouselOrderResult.carouselOrder.flatMap(order => {
        const key = `${order.platform}:${order.placement}`;

        if (duplicatePlacementOrders.has(key)) {
            return [
                `Duplicate promo banner carouselOrder for banner "${bannerId}" at placement "${order.placement}" and platform "${order.platform}".`,
            ];
        }

        duplicatePlacementOrders.add(key);

        return [];
    });

    return [
        ...carouselOrderResult.errors,
        ...eligibilityResult.errors,
        ...duplicatePlacementOrderErrors,
    ];
};

const parsePromoBannerFeature = (feature: Feature): ParsePromoBannerFeatureResult => {
    const errors = getPromoBannerFeatureValidationErrors(feature);

    if (feature.domain !== MessageSystemFeature.banners.dashboard.promo) {
        return {
            errors: [],
            promoBanner: null,
        };
    }

    if (errors.length > 0 || !isObject(feature.payload)) {
        return {
            errors,
            promoBanner: null,
        };
    }

    const bannerId = feature.payload.bannerId ?? feature.visibleBanner;
    const { carouselOrder } = getPromoBannerCarouselOrder(feature.payload.carouselOrder);
    const { eligibility } = getPromoBannerEligibility(feature.payload.eligibility);

    if (!isPromoBannerId(bannerId)) {
        return {
            errors,
            promoBanner: null,
        };
    }

    return {
        errors,
        promoBanner: {
            bannerId,
            isEnabled: feature.flag,
            carouselOrder,
            eligibility,
        },
    };
};

export const parsePromoBannerMessages = (messages: Message[]): ParsePromoBannerMessagesResult => {
    const parsed = messages.flatMap(message =>
        (message.feature ?? [])
            .map(parsePromoBannerFeature)
            .filter(result => result.promoBanner !== null),
    );
    const errors = messages.flatMap(message =>
        (message.feature ?? []).flatMap(feature => getPromoBannerFeatureValidationErrors(feature)),
    );
    const promoBanners = parsed.flatMap(result => (result.promoBanner ? [result.promoBanner] : []));

    const duplicateErrorsByOrder = new Map<string, PromoBannerId[]>();

    promoBanners.forEach(({ bannerId, carouselOrder }) => {
        carouselOrder.forEach(order => {
            const key = `${order.platform}:${order.placement}:${order.value}`;
            const existingBannerIds = duplicateErrorsByOrder.get(key) ?? [];

            duplicateErrorsByOrder.set(key, [...existingBannerIds, bannerId]);
        });
    });

    const duplicateOrderErrors = [...duplicateErrorsByOrder.entries()].flatMap(
        ([key, bannerIds]) => {
            if (bannerIds.length < 2) {
                return [];
            }

            const [platform, placement, value] = key.split(':');
            const sortedBannerIds = bannerIds.toSorted();

            return [
                `Duplicate promo banner carouselOrder ${value} for placement "${placement}" and platform "${platform}": ${sortedBannerIds.join(', ')}.`,
            ];
        },
    );

    return {
        errors: [...errors, ...duplicateOrderErrors],
        promoBanners,
    };
};

const getAccountHasPositiveNativeBalance = (account: PromoBannerAccount, networkSymbol: string) =>
    account.symbol === networkSymbol && new BigNumber(account.balance).gt(0);

const getNormalizedIdentifier = (value: string) => value.toLowerCase();

const getAccountsForNetwork = (accounts: PromoBannerAccount[], networkSymbol: string) =>
    accounts.filter(account => account.symbol === networkSymbol);

const getPositiveTokenBalanceResult = ({
    accounts,
    networkSymbol,
    tokenId,
}: {
    accounts: PromoBannerAccount[];
    networkSymbol: string;
    tokenId: string;
}): boolean | null => {
    const networkAccounts = getAccountsForNetwork(accounts, networkSymbol);

    if (networkAccounts.some(account => account.tokens === undefined)) {
        return null;
    }

    const normalizedTokenId = getNormalizedIdentifier(tokenId);

    return networkAccounts.some(account =>
        account.tokens?.some(
            token =>
                getNormalizedIdentifier(token.contract ?? '') === normalizedTokenId &&
                new BigNumber(token.balance ?? '0').gt(0),
        ),
    );
};

const getEthereumAccountHasPositiveStakingBalance = (account: PromoBannerAccount) => {
    const stakingPools = Array.isArray(account.misc?.stakingPools) ? account.misc.stakingPools : [];

    return stakingPools.some(pool => {
        if (!isObject(pool)) {
            return false;
        }

        return [
            pool.autocompoundBalance,
            pool.pendingBalance,
            pool.pendingDepositedBalance,
            pool.withdrawTotalAmount,
            pool.depositedBalance,
            pool.claimableAmount,
        ].some(value => new BigNumber(typeof value === 'string' ? value : '0').gt(0));
    });
};

const getSolanaAccountHasPositiveStakingBalance = (account: PromoBannerAccount) => {
    const stakingAccounts = [
        ...(Array.isArray(account.misc?.solStakingAccounts) ? account.misc.solStakingAccounts : []),
        ...(Array.isArray(account.misc?.solExternalStakingAccounts)
            ? account.misc.solExternalStakingAccounts
            : []),
    ];

    return stakingAccounts.some(stakingAccount => {
        if (!isObject(stakingAccount)) {
            return false;
        }

        return new BigNumber(
            typeof stakingAccount.stake === 'string' ? stakingAccount.stake : '0',
        ).gt(0);
    });
};

const getCardanoAccountHasPositiveStakingBalance = (account: PromoBannerAccount) => {
    const staking = isObject(account.misc?.staking) ? account.misc.staking : null;

    return staking?.isActive === true && new BigNumber(account.balance).gt(0);
};

const getTronAccountHasPositiveStakingBalance = (account: PromoBannerAccount) => {
    const tronResources = isObject(account.misc?.tronResources) ? account.misc.tronResources : null;
    const stakingInfo = isObject(tronResources?.stakingInfo) ? tronResources.stakingInfo : null;

    return new BigNumber(
        typeof stakingInfo?.stakedBalance === 'string' ? stakingInfo.stakedBalance : '0',
    ).gt(0);
};

const getPositiveStakingProductBalanceResult = (
    accounts: PromoBannerAccount[],
    networkSymbol: string,
): boolean =>
    getAccountsForNetwork(accounts, networkSymbol).some(account => {
        switch (account.networkType) {
            case 'cardano':
                return getCardanoAccountHasPositiveStakingBalance(account);
            case 'ethereum':
                return getEthereumAccountHasPositiveStakingBalance(account);
            case 'solana':
                return getSolanaAccountHasPositiveStakingBalance(account);
            case 'tron':
                return getTronAccountHasPositiveStakingBalance(account);
            default:
                return false;
        }
    });

const evaluateWalletCondition = (
    condition: Extract<
        PromoBannerCondition,
        {
            type:
                | 'asset-balance-positive'
                | 'asset-balance-none'
                | 'product-position-positive'
                | 'product-position-none';
        }
    >,
    accounts: PromoBannerAccount[],
): boolean | null => {
    if (condition.type === 'asset-balance-positive' || condition.type === 'asset-balance-none') {
        const assetId = getPromoBannerAssetId(condition.value);

        if (!assetId) {
            return null;
        }

         const networkAccounts = getAccountsForNetwork(accounts, assetId.networkSymbol);

         if (condition.type === 'asset-balance-none' && networkAccounts.length === 0) {
             return null;
         }

        if (assetId.type === 'native') {
            return networkAccounts.some(account =>
                getAccountHasPositiveNativeBalance(account, assetId.networkSymbol),
            );
        }

        return getPositiveTokenBalanceResult({
            accounts,
            networkSymbol: assetId.networkSymbol,
            tokenId: assetId.tokenId,
        });
    }

    const productId = getPromoBannerProductId(condition.value);

    if (!productId) {
        return null;
    }

    const networkAccounts = getAccountsForNetwork(accounts, productId.networkSymbol);

    if (condition.type === 'product-position-none' && networkAccounts.length === 0) {
        return null;
    }

    if (productId.type === 'staking') {
        return getPositiveStakingProductBalanceResult(networkAccounts, productId.networkSymbol);
    }

    return getPositiveTokenBalanceResult({
        accounts: networkAccounts,
        networkSymbol: productId.networkSymbol,
        tokenId: productId.tokenId,
    });
};

const evaluatePromoBannerCondition = ({
    condition,
    accounts,
    isPortfolioTrackerOnly,
    isWalletDiscoveryFinished,
    selectedDevice,
}: EvaluatePromoBannerConditionParams & {
    condition: PromoBannerCondition;
}) => {
    if (isWalletDependentPromoBannerCondition(condition)) {
        if (!isWalletDiscoveryFinished) {
            return false;
        }

        const walletConditionResult = evaluateWalletCondition(condition, accounts);

        if (walletConditionResult === null) {
            return false;
        }

        return condition.type === 'asset-balance-none' || condition.type === 'product-position-none'
            ? !walletConditionResult
            : walletConditionResult;
    }

    switch (condition.type) {
        case 'physical-trezor-connected':
            return selectedDevice?.connected === true && !isPortfolioTrackerOnly;
        case 'portfolio-tracker-only':
            return isPortfolioTrackerOnly === condition.value;
        case 'device-capability':
            return (
                selectedDevice?.features?.capabilities?.some(
                    capability => capability === condition.value,
                ) ?? false
            );
        case 'device-model':
            return selectedDevice?.features?.internal_model === condition.value;
        case 'device-model-not':
            return selectedDevice?.features?.internal_model !== condition.value;
    }
};

const getPromoBannerEligibilityState = (
    promoBanner: PromoBannerFeatureConfig,
    params: EvaluatePromoBannerConditionParams,
) => {
    const areRequiredConditionsMet = promoBanner.eligibility.required.every(condition =>
        evaluatePromoBannerCondition({ ...params, condition }),
    );

    if (!areRequiredConditionsMet) {
        return false;
    }

    if (promoBanner.eligibility.alternatives.length === 0) {
        return true;
    }

    return promoBanner.eligibility.alternatives.some(alternative =>
        alternative.every(condition => evaluatePromoBannerCondition({ ...params, condition })),
    );
};

export const selectEligiblePromoBanners = ({
    promoBanners,
    platform,
    placement,
    accounts,
    isWalletDiscoveryFinished,
    isPortfolioTrackerOnly,
    selectedDevice,
    reportError,
}: SelectEligiblePromoBannersParams): PromoBannerId[] => {
    const bannersWithOrder = promoBanners.flatMap(promoBanner => {
        if (!promoBanner.isEnabled) {
            return [];
        }

        const matchingCarouselOrder = promoBanner.carouselOrder.find(
            order => order.platform === platform && order.placement === placement,
        );

        if (!matchingCarouselOrder) {
            return [];
        }

        const isEligible = getPromoBannerEligibilityState(promoBanner, {
            accounts,
            isPortfolioTrackerOnly,
            isWalletDiscoveryFinished,
            selectedDevice,
        });

        if (!isEligible) {
            return [];
        }

        return [{ bannerId: promoBanner.bannerId, order: matchingCarouselOrder.value }];
    });

    const duplicateOrders = new Map<number, PromoBannerId[]>();

    bannersWithOrder.forEach(({ bannerId, order }) => {
        const bannerIds = duplicateOrders.get(order) ?? [];

        duplicateOrders.set(order, [...bannerIds, bannerId]);
    });

    duplicateOrders.forEach(bannerIds => {
        if (bannerIds.length < 2 || !reportError) {
            return;
        }

        reportError(
            `Duplicate promo banner carouselOrder reached runtime for placement "${placement}" and platform "${platform}": ${bannerIds.toSorted().join(', ')}.`,
        );
    });

    const orderedBannerIds = bannersWithOrder
        .toSorted((leftBanner, rightBanner) =>
            leftBanner.bannerId.localeCompare(rightBanner.bannerId),
        )
        .toSorted((leftBanner, rightBanner) => leftBanner.order - rightBanner.order)
        .map(({ bannerId }) => bannerId);
    const seenBannerIds = new Set<PromoBannerId>();

    return orderedBannerIds.filter(bannerId => {
        if (seenBannerIds.has(bannerId)) {
            return false;
        }

        seenBannerIds.add(bannerId);

        return true;
    });
};
