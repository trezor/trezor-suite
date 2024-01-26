import React from 'react';
import { H3, Spinner, motionEasing } from '@trezor/components';
import styled from 'styled-components';
import { spacings, spacingsPx } from '@trezor/theme';
import { Translation } from 'src/components/suite';
import { motion, AnimatePresence } from 'framer-motion';

const Container = styled(motion.div)`
    background-color: ${({ theme }) => theme.backgroundTertiaryDefaultOnElevation0};
    border-radius: 48px;
    display: flex;
    align-items: center;
    overflow: hidden;
`;

const SpinnerContainer = styled.div`
    background-color: ${({ theme }) => theme.backgroundSurfaceElevation3};
    border-radius: 50%;
    margin: ${spacingsPx.sm};
    padding: ${spacingsPx.md};
`;
const Content = styled.div`
    margin: ${spacingsPx.sm};
`;
const Description = styled.div`
    color: ${({ theme }) => theme.textSubdued};
`;

const getContainerAnimation = (isPresent: boolean) => ({
    initial: {
        height: 0,
        marginBottom: 0,
    },
    animate: {
        height: 'auto',
        marginBottom: spacings.lg,
    },
    exit: {
        height: 0,
        marginBottom: 0,
    },
    transition: {
        duration: 0.3,
        ease: isPresent ? motionEasing.enter : motionEasing.exit,
    },
});

const getContentAnimation = (isPresent: boolean) => ({
    initial: {
        opacity: 0,
        scale: 0.9,
    },
    animate: {
        opacity: 1,
        scale: 1,
    },
    exit: {
        opacity: 0,
        scale: 0.9,
    },
    transition: {
        duration: 0.3,
        ease: isPresent ? motionEasing.enter : motionEasing.exit,
        opacity: {
            duration: isPresent ? 0.25 : 0.15,
            ease: isPresent ? motionEasing.enter : motionEasing.exit,
        },
    },
});

interface SettingsLoadingProps {
    isPresent?: boolean;
}

export const SettingsLoading = ({ isPresent = false }: SettingsLoadingProps) => (
    <AnimatePresence initial={false}>
        {isPresent && (
            <motion.div {...getContainerAnimation(isPresent)}>
                <Container {...getContentAnimation(isPresent)}>
                    <SpinnerContainer>
                        <Spinner size={40} isGrey={false} />
                    </SpinnerContainer>
                    <Content>
                        <H3>
                            <Translation id="TR_LOADING_ACCOUNTS" />
                        </H3>
                        <Description>
                            <Translation id="TR_LOADING_ACCOUNTS_DESCRIPTION" />
                        </Description>
                    </Content>
                </Container>
            </motion.div>
        )}
    </AnimatePresence>
);
