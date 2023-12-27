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

interface OutputsProps {
    disableAnim?: boolean; // used in tests, with animations enabled react-testing-library can't find output fields
}

export const Outputs = ({ disableAnim }: OutputsProps) => {
    const [height, setHeight] = useState(0);
    const [hasRenderedOutputs, setHasRenderedOutputs] = useState(false);

    const {
        outputs,
        formState: { errors },
    } = useSendFormContext();
    const ref = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        setHeight(ref.current?.offsetHeight || 0);
    }, [outputs, errors.outputs]);

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
                        <StyledCard paddingType="large">
                            {output.type === 'opreturn' ? (
                                <OpReturn outputId={index} />
                            ) : (
                                <>
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
