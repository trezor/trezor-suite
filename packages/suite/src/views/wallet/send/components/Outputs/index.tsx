import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { spacingsPx } from '@trezor/theme';
import { Card, motionEasing } from '@trezor/components';
import { useSendFormContext } from 'src/hooks/wallet';
import { Address } from './components/Address';
import { Amount } from './components/Amount';
import { OpReturn } from './components/OpReturn';
import { motionEasingStrings } from '@trezor/components/src/config/motion';
import { useLayoutSize } from '../../../../../hooks/suite';
import { EvmExplanationBox } from 'src/components/wallet/EvmExplanationBox';
import { Translation } from 'src/components/suite';
import { networks } from '@suite-common/wallet-config';

const Container = styled.div<{ $height: number }>`
    height: ${({ $height }) => ($height ? `${$height}px` : 'auto')};
    transition: height 0.2s ${motionEasingStrings.transition};

    > div {
        display: flex;
        flex-direction: column;
        gap: ${spacingsPx.md};
    }
`;

const StyledCard = styled(Card)`
    gap: ${spacingsPx.xs};
`;

const StyledEvmExplanationBox = styled(EvmExplanationBox)`
    margin-bottom: ${spacingsPx.md};
`;

interface OutputsProps {
    disableAnim?: boolean; // used in tests, with animations enabled react-testing-library can't find output fields
}

export const Outputs = ({ disableAnim }: OutputsProps) => {
    const [height, setHeight] = useState(0);
    const [hasRenderedOutputs, setHasRenderedOutputs] = useState(false);
    const size = useLayoutSize();

    const {
        outputs,
        formState: { errors },
        account,
    } = useSendFormContext();
    const ref = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        setHeight(ref.current?.offsetHeight || 0);
    }, [outputs, errors.outputs, size]);

    // needed to have no entrance animation on the first render
    // for some reason the first render does not have all the outputs
    useEffect(() => {
        if (outputs.length) {
            setHasRenderedOutputs(true);
        }
    }, [outputs]);

    return (
        <Container $height={height || 0}>
            <div ref={ref}>
                {outputs.map((output, index) => (
                    <motion.div
                        layout
                        key={output.id}
                        initial={
                            index === 0 || !hasRenderedOutputs || disableAnim
                                ? undefined
                                : { scale: 0.8, opacity: 0 }
                        }
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                            duration: 0.2,
                            ease: motionEasing.transition,
                        }}
                    >
                        <StyledCard>
                            {output.type === 'opreturn' ? (
                                <OpReturn outputId={index} />
                            ) : (
                                <>
                                    {account.networkType === 'ethereum' && (
                                        <StyledEvmExplanationBox
                                            symbol={account.symbol}
                                            title={
                                                <Translation
                                                    id="TR_EVM_EXPLANATION_SEND_TITLE"
                                                    values={{
                                                        network: networks[account.symbol].name,
                                                    }}
                                                />
                                            }
                                        >
                                            <Translation
                                                id="TR_EVM_EXPLANATION_SEND_DESCRIPTION"
                                                values={{
                                                    network: networks[account.symbol].name,
                                                }}
                                            />
                                        </StyledEvmExplanationBox>
                                    )}
                                    <Address
                                        output={outputs[index]}
                                        outputId={index}
                                        outputsCount={outputs.length}
                                    />

                                    <Amount output={outputs[index]} outputId={index} />
                                </>
                            )}
                        </StyledCard>
                    </motion.div>
                ))}
            </div>
        </Container>
    );
};
