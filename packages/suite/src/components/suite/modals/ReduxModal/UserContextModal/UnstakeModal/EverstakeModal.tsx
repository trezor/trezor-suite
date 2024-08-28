import { Checkbox, NewModal, Column, Warning, Card } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { openModal } from 'src/actions/suite/modalActions';
import { spacings } from '@trezor/theme';
import { useState } from 'react';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

interface EverstakeModalProps {
    onCancel: () => void;
}

export const EverstakeModal = ({ onCancel }: EverstakeModalProps) => {
    const dispatch = useDispatch();
    const [hasAgreed, setHasAgreed] = useState(false);
    const account = useSelector(selectSelectedAccount);

    const proceedToStaking = () => {
        onCancel();
        dispatch(openModal({ type: 'stake' }));
    };

    return (
        <NewModal
            heading={<Translation id="TR_STAKE_ETH" />}
            description={<Translation id="TR_STAKE_YOUR_FUNDS_MAINTAINED" />}
            onCancel={onCancel}
            size="small"
            bottomContent={
                <>
                    <NewModal.Button isDisabled={!hasAgreed} onClick={proceedToStaking}>
                        <Translation id="TR_CONFIRM" />
                    </NewModal.Button>
                    <NewModal.Button variant="tertiary" onClick={onCancel}>
                        <Translation id="TR_CANCEL" />
                    </NewModal.Button>
                </>
            }
        >
            <Column
                gap={spacings.sm}
                margin={{ top: spacings.xs, bottom: spacings.lg }}
                alignItems="stretch"
            >
                <Warning icon="file" variant="info">
                    <Translation
                        id="TR_STAKE_EVERSTAKE_MANAGES"
                        values={{
                            symbol: account?.symbol.toUpperCase(),
                        }}
                    />
                </Warning>
                <Warning icon="shield" variant="info">
                    <Translation id="TR_STAKE_TREZOR_NO_LIABILITY" />
                </Warning>
            </Column>
            <Card>
                <Checkbox
                    verticalAlignment="center"
                    onClick={() => setHasAgreed(!hasAgreed)}
                    isChecked={hasAgreed}
                >
                    <Translation id="TR_STAKE_CONSENT_TO_STAKING_WITH_EVERSTAKE" />
                </Checkbox>
            </Card>
        </NewModal>
    );
};
