import React, { useEffect, useState } from 'react';
import { Icon, variables, useTheme } from '@trezor/components';
import styled from 'styled-components';

const Wrapper = styled.div`
    display: flex;
    background: ${props => props.theme.BG_GREY};
    border-radius: 8px;
    padding: 20px 24px;
    width: 100%;
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    align-items: center;
`;

const Label = styled.div`
    display: flex;
    margin-right: 20px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;
const LineWrapper = styled.div`
    display: flex;
    margin-right: 20px;
    border-radius: 5px;
    background: ${props => props.theme.STROKE_GREY_ALT};
    flex: 1;
    height: 3px;
`;
const Percentage = styled.div`
    display: flex;
    margin-left: 10px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    font-variant-numeric: tabular-nums;
    height: 24px;
`;
const GreenLine = styled.div<{ width: number }>`
    background: ${props => props.theme.TYPE_GREEN};
    width: ${props => props.width}%;
    z-index: 3;
    transition: all 0.8s;

    height: 3px;
    position: relative;
    border-radius: 5px;
`;

interface Props {
    current: number; // current progress
    total: number; // total number of increments
    label: React.ReactNode;
    maintainCompletedState?: boolean; // will maintain 100% completed state, even if current becomes 0 after completion
    fakeProgressDuration?: number; // Will increment progress each second till it hits `fakeProgressBarrier`.
    fakeProgressBarrier?: number; // Barrier where fake progress will wait for real `current` progress to catch up.
}

const ProgressBar = ({
    label,
    total,
    current,
    maintainCompletedState,
    fakeProgressDuration,
    fakeProgressBarrier = 90,
}: Props) => {
    const theme = useTheme();
    const [storedProgress, setStoreProgress] = useState(0);
    const progress = (100 / total) * current;
    const fakeIncrement = fakeProgressDuration ? total / fakeProgressDuration : 0;

    useEffect(() => {
        // This hook is used only for calculating fake progress
        if (fakeProgressDuration) {
            const interval = setInterval(() => {
                setStoreProgress(storedProgress =>
                    storedProgress < fakeProgressBarrier
                        ? Math.floor(storedProgress + fakeIncrement)
                        : storedProgress,
                );
            }, 1000);

            return () => {
                clearInterval(interval);
            };
        }
    }, [fakeIncrement, fakeProgressBarrier, fakeProgressDuration, total]);

    useEffect(() => {
        // This hook is used for maintaining complete state (when current == total).
        // It will also make sure that real progress will replace the fake one if current, real progress  is greater
        if (progress > storedProgress) {
            setStoreProgress(progress);
        }
    }, [progress, storedProgress]);

    return (
        <Wrapper>
            <Label>{label}</Label>
            <LineWrapper>
                <GreenLine
                    width={
                        maintainCompletedState || fakeProgressDuration ? storedProgress : progress
                    }
                />
            </LineWrapper>
            <Percentage>
                {progress < 100 ? (
                    `${fakeProgressDuration ? storedProgress : progress} %`
                ) : (
                    <Icon icon="CHECK" color={theme.TYPE_GREEN} size={24} />
                )}
            </Percentage>
        </Wrapper>
    );
};

export default ProgressBar;
