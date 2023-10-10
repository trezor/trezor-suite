import { useState, ReactNode } from 'react';
import styled, { useTheme } from 'styled-components';
import { Translation } from 'src/components/suite';
import { Icon } from '@trezor/components';
import { useSelector } from 'src/hooks/suite';
import { isDesktop, isWeb } from '@trezor/env-utils';
import { TorSection } from './TorSection';
import { getIsTorEnabled } from 'src/utils/suite/tor';
import { CollapsibleOnboardingCard } from 'src/components/onboarding/CollapsibleOnboardingCard';

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

    > * + * {
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

interface AdvancedSetupProps {
    children: ReactNode;
}

export const AdvancedSetup = ({ children }: AdvancedSetupProps) => {
    const torStatus = useSelector(state => state.suite.torStatus);
    const [torOpen, setTorOpen] = useState(false);

    const theme = useTheme();

    const toggleTor = () => setTorOpen(!torOpen);

    const isTorEnabled = getIsTorEnabled(torStatus);

    return (
        <AdvancedSetupWrapper>
            <Boxes>
                {(isDesktop() || (isWeb() && isTorEnabled)) && (
                    <CollapsibleOnboardingCard
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
                        tag={<Translation id="TR_ONBOARDING_ADVANCED" />}
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
                        <TorSection torStatus={torStatus} />
                    </CollapsibleOnboardingCard>
                )}
            </Boxes>
            <Buttons>{children}</Buttons>
        </AdvancedSetupWrapper>
    );
};
