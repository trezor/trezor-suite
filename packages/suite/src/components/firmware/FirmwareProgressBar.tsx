import { useEffect, useState, ReactNode } from 'react';
import { Icon, ProgressBar, variables } from '@trezor/components';
import styled, { useTheme } from 'styled-components';
import { borders } from '@trezor/theme';

const Wrapper = styled.div`
    display: flex;
    background: ${({ theme }) => theme.BG_GREY};
    border-radius: ${borders.radii.xs};
    padding: 20px 24px;
    width: 100%;
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    align-items: center;

    ${variables.SCREEN_QUERY.ABOVE_LAPTOP} {
        &:last-child {
            border-radius: 0 0 ${borders.radii.md} ${borders.radii.md};
        }
    }
`;

const Label = styled.div`
    display: flex;
    margin-right: 20px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;
const StyledProgressBar = styled(ProgressBar)`
    display: flex;
    margin-right: 20px;
    border-radius: 5px;
    background: ${({ theme }) => theme.STROKE_GREY_ALT};
    flex: 1;

    ${ProgressBar.Value} {
        height: 3px;
        position: relative;
        border-radius: 5px;
    }
`;
const Percentage = styled.div`
    display: flex;
    margin-left: 10px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    font-variant-numeric: tabular-nums;
    height: 24px;
`;

interface FirmwareProgressBarProps {
    current: number; // current progress
    total: number; // total number of increments
    label: ReactNode;
    maintainCompletedState?: boolean; // will maintain 100% completed state, even if current becomes 0 after completion
    fakeProgressDuration?: number; // Will increment progress each second till it hits `fakeProgressBarrier`.
    fakeProgressBarrier?: number; // Barrier where fake progress will wait for real `current` progress to catch up.
}

export const FirmwareProgressBar = ({
    label,
    total,
    current,
    maintainCompletedState,
    fakeProgressDuration,
    fakeProgressBarrier = 90,
}: FirmwareProgressBarProps) => {
    const theme = useTheme();
    const [storedProgress, setStoreProgress] = useState(0);
    const progress = (100 / total) * current;
    const fakeIncrement = fakeProgressDuration ? total / fakeProgressDuration : 0;
    const progressValue =
        maintainCompletedState || fakeProgressDuration ? storedProgress : progress;

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
            <StyledProgressBar value={progressValue} />
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
