import { type Route } from '@suite/router';
import { type GuideCategory, type GuideNode } from '@suite-common/suite-types';

import { GUIDE_ARTICLE_IDS, type GuideArticleId } from 'src/constants/suite/guide';

type GuideContext = {
    routeName?: Route['name'];
    networkSymbol?: string;
    networkType?: string;
};

const DASHBOARD_GUIDE_ARTICLE_IDS = [
    GUIDE_ARTICLE_IDS.activateAssets,
    GUIDE_ARTICLE_IDS.addAccount,
    GUIDE_ARTICLE_IDS.discreetMode,
] as const;

const SEND_GUIDE_ARTICLE_IDS = [
    GUIDE_ARTICLE_IDS.sendingCrypto,
    GUIDE_ARTICLE_IDS.transactionFees,
    GUIDE_ARTICLE_IDS.replaceByFee,
    GUIDE_ARTICLE_IDS.coinControl,
] as const;

const RECEIVE_GUIDE_ARTICLE_IDS = [
    GUIDE_ARTICLE_IDS.receivingCrypto,
    GUIDE_ARTICLE_IDS.uriHandlers,
] as const;

const GUIDE_ARTICLE_IDS_BY_ROUTE_NAME: Partial<Record<Route['name'], readonly GuideArticleId[]>> = {
    'suite-start': [
        GUIDE_ARTICLE_IDS.installFirmware,
        GUIDE_ARTICLE_IDS.walletBackup,
        GUIDE_ARTICLE_IDS.passphrase,
    ],
    'onboarding-index': [
        GUIDE_ARTICLE_IDS.installFirmware,
        GUIDE_ARTICLE_IDS.walletBackup,
        GUIDE_ARTICLE_IDS.passphrase,
    ],
    'suite-index': DASHBOARD_GUIDE_ARTICLE_IDS,
    'suite-connect-popup': [GUIDE_ARTICLE_IDS.activateAssets, GUIDE_ARTICLE_IDS.application],
    'suite-switch-device': [GUIDE_ARTICLE_IDS.passphrase, GUIDE_ARTICLE_IDS.autoEjectWallets],
    'settings-index': [
        GUIDE_ARTICLE_IDS.application,
        GUIDE_ARTICLE_IDS.localization,
        GUIDE_ARTICLE_IDS.tor,
    ],
    'settings-device': [
        GUIDE_ARTICLE_IDS.walletBackup,
        GUIDE_ARTICLE_IDS.bitcoinOnlyFirmware,
        GUIDE_ARTICLE_IDS.passphrase,
        GUIDE_ARTICLE_IDS.wipeCode,
    ],
    'settings-coins': [
        GUIDE_ARTICLE_IDS.activateAssets,
        GUIDE_ARTICLE_IDS.supportedCoins,
        GUIDE_ARTICLE_IDS.addingTokens,
    ],
    'settings-connected-apps': [GUIDE_ARTICLE_IDS.uriHandlers, GUIDE_ARTICLE_IDS.application],
    'settings-debug': [GUIDE_ARTICLE_IDS.application, GUIDE_ARTICLE_IDS.experimentalFeatures],
    'wallet-index': DASHBOARD_GUIDE_ARTICLE_IDS,
    'wallet-details': [GUIDE_ARTICLE_IDS.labeling, GUIDE_ARTICLE_IDS.connectOwnNode],
    'wallet-receive': RECEIVE_GUIDE_ARTICLE_IDS,
    'wallet-send': SEND_GUIDE_ARTICLE_IDS,
    'wallet-sign-verify': [GUIDE_ARTICLE_IDS.signAndVerify],
    'wallet-tokens': [GUIDE_ARTICLE_IDS.addingTokens],
    'wallet-tokens-hidden': [GUIDE_ARTICLE_IDS.addingTokens],
    'wallet-tokens-inactive': [GUIDE_ARTICLE_IDS.addingTokens],
    'wallet-tokens-defi': [GUIDE_ARTICLE_IDS.addingTokens],
    'wallet-trading-buy': [GUIDE_ARTICLE_IDS.buy],
    'wallet-trading-buy-detail': [GUIDE_ARTICLE_IDS.buy],
    'wallet-trading-buy-confirm': [GUIDE_ARTICLE_IDS.buy],
    'wallet-trading-exchange': [GUIDE_ARTICLE_IDS.exchange],
    'wallet-trading-exchange-detail': [GUIDE_ARTICLE_IDS.exchange],
    'wallet-trading-exchange-confirm': [GUIDE_ARTICLE_IDS.exchange],
    'wallet-trading-sell': [GUIDE_ARTICLE_IDS.sell],
    'wallet-trading-sell-detail': [GUIDE_ARTICLE_IDS.sell],
    'wallet-trading-sell-confirm': [GUIDE_ARTICLE_IDS.sell],
    'wallet-trading-transactions': [
        GUIDE_ARTICLE_IDS.buy,
        GUIDE_ARTICLE_IDS.exchange,
        GUIDE_ARTICLE_IDS.sell,
    ],
    'wallet-staking': [
        GUIDE_ARTICLE_IDS.ethereumStaking,
        GUIDE_ARTICLE_IDS.solanaStaking,
        GUIDE_ARTICLE_IDS.cardanoStaking,
    ],
    'suite-earn': [
        GUIDE_ARTICLE_IDS.ethereumStaking,
        GUIDE_ARTICLE_IDS.solanaStaking,
        GUIDE_ARTICLE_IDS.cardanoStaking,
    ],
    'earn-deposit': [
        GUIDE_ARTICLE_IDS.ethereumStaking,
        GUIDE_ARTICLE_IDS.solanaStaking,
        GUIDE_ARTICLE_IDS.cardanoStaking,
    ],
    'earn-withdraw': [
        GUIDE_ARTICLE_IDS.ethereumStaking,
        GUIDE_ARTICLE_IDS.solanaStaking,
        GUIDE_ARTICLE_IDS.cardanoStaking,
    ],
    'earn-claim': [
        GUIDE_ARTICLE_IDS.ethereumStaking,
        GUIDE_ARTICLE_IDS.solanaStaking,
        GUIDE_ARTICLE_IDS.cardanoStaking,
    ],
    'firmware-index': [GUIDE_ARTICLE_IDS.installFirmware, GUIDE_ARTICLE_IDS.bitcoinOnlyFirmware],
    'firmware-type': [GUIDE_ARTICLE_IDS.installFirmware, GUIDE_ARTICLE_IDS.bitcoinOnlyFirmware],
    'firmware-custom': [GUIDE_ARTICLE_IDS.installFirmware],
    'backup-index': [GUIDE_ARTICLE_IDS.walletBackup],
    'create-multi-share-backup': [GUIDE_ARTICLE_IDS.walletBackup],
    'recovery-index': [GUIDE_ARTICLE_IDS.walletBackup],
};

const isRouteName = (
    routeName: Route['name'] | undefined,
    routeNames: readonly Route['name'][],
): routeName is Route['name'] => routeName !== undefined && routeNames.includes(routeName);

const addUniqueArticleIds = (
    guideArticleIds: GuideArticleId[],
    nextGuideArticleIds: readonly GuideArticleId[] = [],
) => {
    nextGuideArticleIds.forEach(guideArticleId => {
        if (!guideArticleIds.includes(guideArticleId)) {
            guideArticleIds.push(guideArticleId);
        }
    });
};

const getNetworkGuideArticleIds = ({
    routeName,
    networkSymbol,
    networkType,
}: GuideContext): readonly GuideArticleId[] => {
    if (routeName === 'wallet-send' && (networkType === 'ripple' || networkType === 'stellar')) {
        return [GUIDE_ARTICLE_IDS.destinationTags];
    }

    if (
        isRouteName(routeName, [
            'wallet-staking',
            'suite-earn',
            'earn-deposit',
            'earn-withdraw',
            'earn-claim',
        ])
    ) {
        if (networkSymbol === 'ada') {
            return [GUIDE_ARTICLE_IDS.cardanoStaking];
        }

        if (networkSymbol === 'sol') {
            return [GUIDE_ARTICLE_IDS.solanaStaking];
        }

        if (networkSymbol === 'eth') {
            return [GUIDE_ARTICLE_IDS.ethereumStaking];
        }
    }

    return [];
};

/** @returns title in given language or in english if not available. */
export const getNodeTitle = (node: GuideNode, language: string): string =>
    node.title[language.toLowerCase()] || node.title['en-us'];

export const getNodeById = (id: string, root: GuideNode): GuideNode | undefined => {
    if (id === root.id) {
        return root;
    }

    if (root.type !== 'category') {
        return undefined;
    }

    return root.children.map(child => getNodeById(id, child)).find(it => it !== undefined);
};

export const getGuideContextArticleIds = (context: GuideContext): GuideArticleId[] => {
    const guideArticleIds: GuideArticleId[] = [];

    addUniqueArticleIds(guideArticleIds, getNetworkGuideArticleIds(context));
    addUniqueArticleIds(
        guideArticleIds,
        context.routeName ? GUIDE_ARTICLE_IDS_BY_ROUTE_NAME[context.routeName] : undefined,
    );

    return guideArticleIds;
};

/**
 * @returns ids of ancestors of given node id.
 * Example: '/cryptocurrencies/ethereum' -> ['/', '/cryptocurrencies']
 */
export const getAncestorIds = (id: string): string[] =>
    id
        .split('/')
        // omit the node itself - only consider its ancestors
        .slice(0, -1)
        // 'Absolutize' each exploded parent, effectively getting its ID.
        .reduce<string[]>((ids, ancestor) => {
            const id = `${ids[ids.length - 1] || '/'}${ids.length > 1 ? '/' : ''}${ancestor}`;

            return [...ids, id];
        }, []);

/** @returns ancestors nodes for node. */
export const findAncestorNodes = (node: GuideNode, root: GuideCategory): GuideNode[] => {
    const ancestorIds = getAncestorIds(node.id);

    return (
        ancestorIds
            // omit root node as it is global ancestor
            .filter(id => id !== '/')
            .map(id => getNodeById(id, root))
            // omit not-existing nodes
            .filter((ancestorNode): ancestorNode is GuideNode => {
                if (ancestorNode === undefined) {
                    throw Error(`Ancestor node of '${node.id}' node was not found!`);
                }

                return true;
            })
    );
};
