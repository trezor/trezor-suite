import React from 'react';
import styled from 'styled-components';
import { variables, Switch } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { useActions } from 'src/hooks/suite';
import { toggleTor as toggleTorAction } from 'src/actions/suite/suiteActions';
import { getIsTorEnabled, getIsTorLoading } from 'src/utils/suite/tor';
import { TorStatus } from 'src/types/suite';

const TorWrapper = styled.div`
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
    margin-bottom: 12px;
    border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
`;

const Label = styled.div`
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    font-weight: 500;
`;

const SwitchWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
`;

interface TorSectionProps {
    torStatus: TorStatus;
}

export const TorSection = ({ torStatus }: TorSectionProps) => {
    const { toggleTor } = useActions({
        toggleTor: toggleTorAction,
    });

    const isTorEnabled = getIsTorEnabled(torStatus);
    const isTorLoading = getIsTorLoading(torStatus);

    return (
        <TorWrapper>
            <Label>
                <Translation id="TR_TOR_ENABLE_TITLE" />
            </Label>
            <SwitchWrapper>
                <Switch
                    dataTest="@onboarding/tor-switch"
                    isChecked={isTorEnabled || torStatus === TorStatus.Enabling}
                    isDisabled={isTorLoading}
                    onChange={() => {
                        toggleTor(!isTorEnabled);
                    }}
                />
            </SwitchWrapper>
        </TorWrapper>
    );
};
