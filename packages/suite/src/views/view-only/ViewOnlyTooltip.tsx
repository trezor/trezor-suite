import { Button, Text, Tooltip } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectSuiteFlags } from 'src/reducers/suite/suiteReducer';
import styled from 'styled-components';
import { setFlag } from 'src/actions/suite/suiteActions';
import { Translation } from 'src/components/suite';

type ViewOnlyTooltipProps = {
    children: React.ReactNode;
};

const Notification = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    z-index: 1;
    gap: ${spacingsPx.xs};
`;

const TextContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xxs};
`;

export const ViewOnlyTooltip = ({ children }: ViewOnlyTooltipProps) => {
    const { viewOnlyTooltipClosed } = useSelector(selectSuiteFlags);
    const dispatch = useDispatch();
    const isViewOnlyModeVisible = useSelector(
        state => state.suite.settings.debug.isViewOnlyModeVisible,
    );

    const handleClose = () => {
        dispatch(setFlag('viewOnlyTooltipClosed', true));
    };

    return (
        <Tooltip
            isOpen={isViewOnlyModeVisible && !viewOnlyTooltipClosed}
            hasArrow
            shift={{ padding: { left: 10 } }}
            content={
                <Notification>
                    <TextContent>
                        <Text variant="primary">
                            <Translation id="TR_VIEW_ONLY_TOOLTIP_TITLE" />
                        </Text>
                        <Text>
                            <Translation id="TR_VIEW_ONLY_TOOLTIP_DESCRIPTION" />
                        </Text>
                        <Text typographyStyle="label" variant="tertiary">
                            <Translation id="TR_VIEW_ONLY_TOOLTIP_CHANGE_INFO" />
                        </Text>
                    </TextContent>
                    <Button variant="tertiary" onClick={handleClose}>
                        <Translation id="TR_VIEW_ONLY_TOOLTIP_BUTTON" />
                    </Button>
                </Notification>
            }
        >
            {children}
        </Tooltip>
    );
};
