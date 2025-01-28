import { useState } from 'react';

import { type NetworkType, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { SOLANA_EPOCH_DAYS } from '@suite-common/wallet-constants';
import { selectValidatorsQueueData } from '@suite-common/wallet-core';
import { Banner, Card, Checkbox, Column, NewModal } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { HELP_CENTER_ETH_STAKING } from '@trezor/urls';

import { openModal } from 'src/actions/suite/modalActions';
import { Translation, TrezorLink } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { getDaysToAddToPoolInitial } from 'src/utils/suite/ethereumStaking';

const getStakeEnteringMessage = (networkType?: NetworkType) => {
    if (networkType === 'ethereum') return 'TR_STAKE_ENTERING_POOL_MAY_TAKE';

    return 'TR_STAKE_ACTIVATION_COULD_TAKE';
};

interface ConfirmStakeEthModalProps {
    isLoading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmStakeEthModal = ({
    isLoading,
    onConfirm,
    onCancel,
}: ConfirmStakeEthModalProps) => {
    const dispatch = useDispatch();
    const [hasAgreed, setHasAgreed] = useState(false);
    const account = useSelector(selectSelectedAccount);
    const validatorsQueue = useSelector(state => selectValidatorsQueueData(state, account?.symbol));

    const daysToAddToPoolInitial = getDaysToAddToPoolInitial(validatorsQueue);
    const daysToAddToPool = daysToAddToPoolInitial === undefined ? 30 : daysToAddToPoolInitial;

    const isDisabled = !hasAgreed || isLoading;

    const handleOnCancel = () => {
        onCancel();
        dispatch(openModal({ type: 'stake' }));
    };

    const onClick = () => {
        onConfirm();
    };

    if (!account) return null;

    return (
        <NewModal
            heading={<Translation id="TR_STAKE_CONFIRM_ENTRY_PERIOD" />}
            onCancel={handleOnCancel}
            size="small"
            variant="warning"
            bottomContent={
                <>
                    <NewModal.Button isDisabled={isDisabled} onClick={onClick}>
                        <Translation id="TR_STAKE_CONFIRM_AND_STAKE" />
                    </NewModal.Button>
                    <NewModal.Button variant="tertiary" onClick={handleOnCancel}>
                        <Translation id="TR_CANCEL" />
                    </NewModal.Button>
                </>
            }
        >
            <Column gap={spacings.sm} margin={{ top: spacings.xxs, bottom: spacings.lg }}>
                <Banner icon="clock">
                    <Translation
                        id={getStakeEnteringMessage(account?.networkType)}
                        values={{
                            count:
                                account?.networkType === 'ethereum'
                                    ? daysToAddToPool
                                    : SOLANA_EPOCH_DAYS,
                        }}
                    />
                </Banner>
                <Banner icon="hand">
                    <Translation
                        id="TR_STAKE_ETH_WILL_BE_BLOCKED"
                        values={{
                            a: chunks => (
                                <TrezorLink
                                    target="_blank"
                                    variant="underline"
                                    href={HELP_CENTER_ETH_STAKING}
                                >
                                    {chunks}
                                </TrezorLink>
                            ),
                            networkDisplaySymbol: getNetworkDisplaySymbol(account.symbol),
                        }}
                    />
                </Banner>
            </Column>

            <Card>
                <Checkbox onClick={() => setHasAgreed(!hasAgreed)} isChecked={hasAgreed}>
                    <Translation id="TR_STAKE_ACKNOWLEDGE_ENTRY_PERIOD" />
                </Checkbox>
            </Card>
        </NewModal>
    );
};
