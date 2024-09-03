import { useState } from 'react';
import { Checkbox, NewModal, Column, Banner, Card } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { Translation, TrezorLink } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { openModal } from 'src/actions/suite/modalActions';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { selectValidatorsQueueData } from '@suite-common/wallet-core';
import { HELP_CENTER_ETH_STAKING } from '@trezor/urls';
import { getDaysToAddToPoolInitial } from 'src/utils/suite/stake';

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

    const isDisabled = !hasAgreed || isLoading;

    const handleOnCancel = () => {
        onCancel();
        dispatch(openModal({ type: 'stake' }));
    };

    const onClick = () => {
        onConfirm();
    };

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
            <Column
                gap={spacings.sm}
                margin={{ top: spacings.xxs, bottom: spacings.lg }}
                alignItems="stretch"
            >
                <Banner icon="clock">
                    <Translation
                        id="TR_STAKE_ENTERING_POOL_MAY_TAKE"
                        values={{
                            count:
                                daysToAddToPoolInitial === undefined ? 30 : daysToAddToPoolInitial,
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
                            symbol: account?.symbol.toUpperCase(),
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
