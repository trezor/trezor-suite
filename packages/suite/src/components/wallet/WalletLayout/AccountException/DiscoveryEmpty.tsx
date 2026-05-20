import { Translation } from '@suite/intl';
import { goto } from '@suite/router';

import { AccountExceptionLayout } from 'src/components/wallet';
import { GUIDE_ARTICLE_IDS } from 'src/constants/suite/guide';
import { useGuideOpenNode } from 'src/hooks/guide';
import { useDispatch } from 'src/hooks/suite';

/**
 * Handler for invalid wallet setting, no coins in discovery
 * see: @wallet-actions/selectedAccountActions
 */
export const DiscoveryEmpty = () => {
    const dispatch = useDispatch();
    const { openNodeById } = useGuideOpenNode();

    const goToCoinsSettings = () => dispatch(goto({ routeName: 'settings-coins' }));
    const openActivateAssetsGuide = () => openNodeById(GUIDE_ARTICLE_IDS.activateAssets);

    return (
        <AccountExceptionLayout
            title={<Translation id="TR_ACCOUNT_EXCEPTION_DISCOVERY_EMPTY" />}
            iconName="cloud"
            iconVariant="info"
            description={<Translation id="TR_ACCOUNT_EXCEPTION_DISCOVERY_EMPTY_DESC" />}
            actions={[
                {
                    key: '1',
                    iconLeft: 'gear',
                    onClick: goToCoinsSettings,
                    children: <Translation id="TR_COIN_SETTINGS" />,
                },
                {
                    key: '2',
                    iconLeft: 'lightbulb',
                    intent: 'neutral',
                    priority: 'secondary',
                    onClick: openActivateAssetsGuide,
                    children: <Translation id="TR_LEARN_MORE" />,
                },
            ]}
        />
    );
};
