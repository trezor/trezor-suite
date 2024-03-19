import styled, { useTheme } from 'styled-components';
import { Button, Checkbox, Icon } from '@trezor/components';
import { Modal, Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { openModal } from 'src/actions/suite/modalActions';
import { EverstakeLogo } from 'src/views/wallet/staking/components/EthStakingDashboard/components/EverstakeLogo';
import { borders, spacingsPx } from '@trezor/theme';
import { variables } from '@trezor/components/src/config';
import { useState } from 'react';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

const StyledModal = styled(Modal)`
    width: 522px;

    & > header {
        min-height: auto;
        border-bottom: none;
        padding: ${spacingsPx.xs} ${spacingsPx.xl};
    }

    & > div > div > div:first-of-type {
        padding: ${spacingsPx.xl} ${spacingsPx.xs};
    }
`;

const HeadingAccent = styled.div`
    color: ${({ theme }) => theme.textAlertYellow};
`;

const TextSubdued = styled.span`
    color: ${({ theme }) => theme.textSubdued};
`;

const Subheading = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xxs};
    color: ${({ theme }) => theme.textSubdued};
    padding: 0 ${spacingsPx.md};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const VStack = styled.div`
    margin-top: ${spacingsPx.lg};
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xs};
`;

const VStackItem = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xl};
    background: ${({ theme }) => theme.backgroundSurfaceElevation0};
    border-radius: ${borders.radii.xs};
    padding: ${spacingsPx.lg} ${spacingsPx.md};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const StyledCheckbox = styled(Checkbox)`
    margin: ${spacingsPx.xl} 0;
    padding: 0 ${spacingsPx.md};

    & > div:nth-child(3) {
        margin-left: ${spacingsPx.xs};
    }
`;

interface EverstakeModalProps {
    onCancel: () => void;
}

export const EverstakeModal = ({ onCancel }: EverstakeModalProps) => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const [hasAgreed, setHasAgreed] = useState(false);
    const account = useSelector(selectSelectedAccount);

    const proceedToStaking = () => {
        onCancel();
        dispatch(openModal({ type: 'stake' }));
    };

    return (
        <StyledModal
            isCancelable
            headingSize="large"
            heading={
                <>
                    <Translation
                        id="TR_STAKE_YOUR_FUNDS_MANAGED"
                        values={{ h: text => <HeadingAccent>{text}</HeadingAccent> }}
                    />
                </>
            }
            onCancel={onCancel}
        >
            <Subheading>
                <Translation id="TR_STAKE_POWERED_BY" />
                <EverstakeLogo color={theme.textSubdued} />
            </Subheading>

            <VStack>
                <VStackItem>
                    <Icon icon="FILE" color={theme.textAlertYellow} />

                    <div>
                        <Translation
                            id="TR_STAKE_EVERSTAKE_MANAGES"
                            values={{
                                t: text => <TextSubdued>{text}</TextSubdued>,
                                symbol: account?.symbol.toUpperCase(),
                            }}
                        />
                    </div>
                </VStackItem>
                <VStackItem>
                    <Icon icon="SHIELD" color={theme.textAlertYellow} />

                    <div>
                        <Translation
                            id="TR_STAKE_TREZOR_NO_LIABILITY"
                            values={{ t: text => <TextSubdued>{text}</TextSubdued> }}
                        />
                    </div>
                </VStackItem>
            </VStack>

            <StyledCheckbox onClick={() => setHasAgreed(!hasAgreed)} isChecked={hasAgreed}>
                <Translation id="TR_STAKE_CONSENT_TO_STAKING_WITH_EVERSTAKE" />
            </StyledCheckbox>

            <Button isFullWidth isDisabled={!hasAgreed} onClick={proceedToStaking}>
                <Translation id="TR_CONFIRM" />
            </Button>
        </StyledModal>
    );
};
