import { selectSelectedAccount } from '@suite/account';
import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { type PrecomposedLevels, type PrecomposedLevelsCardano } from '@suite-common/wallet-types';
import { calculateTronFreezeSuggestion } from '@suite-common/wallet-utils';
import { type TronAccountExtraData } from '@trezor/blockchain-link-types';
import { Banner } from '@trezor/components';

import { FormattedCryptoAmount } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';

type TronFreezeFeeBannerProps = {
    composedLevels?: PrecomposedLevels | PrecomposedLevelsCardano | null;
    tronResources?: TronAccountExtraData;
};

export const TronFreezeFeeBanner = ({
    composedLevels,
    tronResources,
}: TronFreezeFeeBannerProps) => {
    const dispatch = useDispatch();
    const account = useSelector(selectSelectedAccount);

    const freezeAmount = calculateTronFreezeSuggestion(composedLevels?.normal, tronResources);

    if (!account || !freezeAmount) {
        return null;
    }

    const goToFreeze = () =>
        dispatch(
            goto({
                routeName: 'earn-tron-stake',
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );

    return (
        <Banner
            icon="lightbulb"
            intent="info"
            rightContent={
                <Banner.Button onClick={goToFreeze}>
                    <Translation id="TR_TRON_FREEZE_FEE_BANNER_CTA" />
                </Banner.Button>
            }
            description={
                <Translation
                    id="TR_TRON_FREEZE_FEE_BANNER_ENERGY"
                    values={{
                        amount: (
                            <FormattedCryptoAmount
                                disableHiddenPlaceholder
                                value={freezeAmount}
                                symbol={account.symbol}
                            />
                        ),
                    }}
                />
            }
        />
    );
};
