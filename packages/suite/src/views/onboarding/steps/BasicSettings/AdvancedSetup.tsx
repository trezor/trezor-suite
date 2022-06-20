import React, { useState } from 'react';
import { Translation } from '@suite-components';
import { Box } from '@onboarding-components';
import styled from 'styled-components';
import { Icon, useTheme } from '@trezor/components';
import { useSelector } from '@suite-hooks';
import { isDesktop, isWeb } from '@suite-utils/env';
import Tor from './Tor';
import { getIsTorEnabled } from '@suite-utils/tor';

const AdvancedSetupWrapper = styled.div`
    width: 100%;
    text-align: center;
`;

const Boxes = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    text-align: left;
    margin-bottom: 36px;
    & > * + * {
        margin-top: 24px;
    }
`;

const Buttons = styled.div`
    display: flex;
    justify-content: center;
    padding-bottom: 36px;
`;

const IconWrapper = styled.div`
    margin: 0 28px 0 0;
`;

interface Props {
    children: React.ReactNode;
}

const AdvancedSetup = ({ children }: Props) => {
    const [torOpen, setTorOpen] = useState(false);
    const theme = useTheme();

    const isTorEnabled = useSelector(state => getIsTorEnabled(state.suite.torStatus));

    const toggleTor = () => {
        setTorOpen(!torOpen);
    };

    return (
        <AdvancedSetupWrapper>
            <Boxes>
                {(isDesktop() || (isWeb() && isTorEnabled)) && (
                    <Box
                        heading={<Translation id="TR_TOR" />}
                        description={
                            <Translation
                                id="TR_TOR_DESCRIPTION"
                                values={{
                                    lineBreak: <br />,
                                }}
                            />
                        }
                        expandable
                        expanded={torOpen}
                        expandableIcon={
                            <IconWrapper>
                                {isTorEnabled ? (
                                    <Icon icon="CHECK" size={24} color={theme.TYPE_LIGHT_GREY} />
                                ) : (
                                    <Icon icon="PLUS" size={24} color={theme.TYPE_LIGHT_GREY} />
                                )}
                            </IconWrapper>
                        }
                        onToggle={toggleTor}
                    >
                        <Tor tor={isTorEnabled} />
                    </Box>
                )}
            </Boxes>
            <Buttons>{children}</Buttons>
        </AdvancedSetupWrapper>
    );
};

export default AdvancedSetup;
