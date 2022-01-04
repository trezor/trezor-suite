import React, { useState } from 'react';
import { Translation } from '@suite-components';
import { Box } from '@onboarding-components';
import styled from 'styled-components';
import { Icon, useTheme } from '@trezor/components';
import { useSelector } from '@suite-hooks';
import { isDesktop, isWeb } from '@suite-utils/env';
import Tor from './Tor';

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

    const { tor } = useSelector(state => ({
        tor: state.suite.tor,
    }));

    const toggleTor = () => {
        setTorOpen(!torOpen);
    };

    return (
        <AdvancedSetupWrapper>
            <Boxes>
                {(isDesktop() || (isWeb() && tor)) && (
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
                                {tor ? (
                                    <Icon icon="CHECK" size={24} color={theme.TYPE_LIGHT_GREY} />
                                ) : (
                                    <Icon icon="PLUS" size={24} color={theme.TYPE_LIGHT_GREY} />
                                )}
                            </IconWrapper>
                        }
                        onToggle={toggleTor}
                    >
                        <Tor tor={tor} />
                    </Box>
                )}
            </Boxes>
            <Buttons>{children}</Buttons>
        </AdvancedSetupWrapper>
    );
};

export default AdvancedSetup;
