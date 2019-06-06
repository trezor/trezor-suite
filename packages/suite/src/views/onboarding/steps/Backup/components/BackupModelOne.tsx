import React from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';

import {
    StepWrapper,
    StepBodyWrapper,
    StepHeadingWrapper,
} from '@suite/components/onboarding/Wrapper';
import { ConnectReducer, ConnectActions } from '@suite/types/onboarding/connect';

import l10nMessages from './BackupModelOne.messages';
import NthWord from './NthWord';

const Wrapper = styled.div`
    font-size: xx-large;
`;

interface Props {
    connectActions: ConnectActions;
    device: ConnectReducer['device'];
    deviceInteraction: ConnectReducer['deviceInteraction'];
}

class BackupProgressModelOne extends React.Component<Props> {
    startBackup = () => {
        this.props.connectActions.backupDevice();
    };

    isCheckingWords = () => this.props.deviceInteraction.counter - 24 > 0;

    render() {
        const { device, deviceInteraction } = this.props;
        return (
            <StepWrapper>
                <StepHeadingWrapper />
                <StepBodyWrapper>
                    {device &&
                        device.features.needs_backup === true &&
                        deviceInteraction.counter > 0 &&
                        this.isCheckingWords() && (
                            <Wrapper>
                                <FormattedMessage
                                    {...l10nMessages.TR_CHECK_NTH_WORD}
                                    values={{
                                        NthWord: (
                                            <NthWord number={deviceInteraction.counter - 24} />
                                        ),
                                    }}
                                />
                            </Wrapper>
                        )}

                    {device &&
                        device.features.needs_backup === true &&
                        !this.isCheckingWords() &&
                        deviceInteraction.counter > 0 && (
                            <Wrapper>
                                <FormattedMessage
                                    {...l10nMessages.TR_WRITE_DOWN_NTH_WORD}
                                    values={{
                                        NthWord: <NthWord number={deviceInteraction.counter} />,
                                    }}
                                />
                            </Wrapper>
                        )}
                </StepBodyWrapper>
            </StepWrapper>
        );
    }
}

export default BackupProgressModelOne;
