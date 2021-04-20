import React, { useState } from 'react';
import { Translation } from '@suite-components';
import { Box } from '@onboarding-components';
import styled from 'styled-components';
import { Network } from '@wallet-types';
import { variables } from '@trezor/components';
import CustomBackend from './CustomBackend';

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

const BackendGrid = styled.div<{ border?: boolean }>`
    width: 100%;
    display: grid;
    grid-template-columns: 0.75fr 1fr 1fr;
    grid-template-rows: 1fr;
    gap: 9px 54px;
    padding: 9px 0 0 0;
    margin: 0 0 12px 0;

    ${props =>
        props.border &&
        `
        border-top: 1px solid ${props.theme.STROKE_GREY};
    `}
`;

const ActiveLabel = styled.div`
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const InputLabel = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

interface Props {
    networks: Network[];
    children: React.ReactNode;
}

const AdvancedSetup = ({ networks, children }: Props) => {
    const [customBackendOpen, setCustomBackendOpen] = useState(false);
    const [torOpen, setTorOpen] = useState(false);

    return (
        <AdvancedSetupWrapper>
            <Boxes>
                <Box
                    heading={<Translation id="TR_ONBOARDING_CUSTOM_BACKEND_HEADING" />}
                    description={<Translation id="TR_ONBOARDING_CUSTOM_BACKEND_DESCRIPTION" />}
                    expandable
                    expanded={customBackendOpen}
                    onToggle={() => setCustomBackendOpen(!customBackendOpen)}
                >
                    <>
                        <BackendGrid>
                            <ActiveLabel>
                                {networks.length} <Translation id="TR_ACTIVE" />
                            </ActiveLabel>
                            <InputLabel>
                                <Translation id="SETTINGS_ADV_COIN_BLOCKBOOK_TITLE" />
                            </InputLabel>
                        </BackendGrid>
                        {networks.map(network => (
                            <CustomBackend network={network} />
                        ))}
                    </>
                </Box>
                <Box
                    heading={<Translation id="TR_ONBOARDING_TOR_HEADING" />}
                    description={<Translation id="TR_ONBOARDING_TOR_DESCRIPTION" />}
                    expandable
                    expanded={torOpen}
                    onToggle={() => setTorOpen(!torOpen)}
                />
            </Boxes>
            {children}
        </AdvancedSetupWrapper>
    );
};

export default AdvancedSetup;
