import { Button, Icon, Text, Tooltip } from '@trezor/components';
import { borders, palette, spacingsPx, zIndices } from '@trezor/theme';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectSuiteFlags } from 'src/reducers/suite/suiteReducer';
import styled, { useTheme } from 'styled-components';
import { setFlag } from 'src/actions/suite/suiteActions';
import { Translation } from 'src/components/suite';

type ViewOnlyTooltipProps = {
    children: React.ReactNode;
};

const Icons = styled.div`
    display: flex;
    flex-direction: row;
`;

const IconContainer = styled.div`
    border: solid 1px ${palette.lightWhiteAlpha400};
    background-color: ${palette.darkGray300};
    border-radius: ${borders.radii.full};
    padding: 4px;

    &:nth-child(1) {
        z-index: 1;
    }

    &:nth-child(2) {
        position: relative;
        left: -4px;
        z-index: 0;
    }
`;

const Notification = styled.div`
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    z-index: 1;
    gap: ${spacingsPx.xxxl};
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xs};
    max-width: 180px;
`;

export const ViewOnlyTooltip = ({ children }: ViewOnlyTooltipProps) => {
    const { viewOnlyTooltipClosed, viewOnlyPromoClosed } = useSelector(selectSuiteFlags);
    const dispatch = useDispatch();
    const isOpen = viewOnlyPromoClosed && !viewOnlyTooltipClosed;

    const handleClose = () => {
        dispatch(setFlag('viewOnlyTooltipClosed', true));
    };
    const theme = useTheme();

    return (
        <Tooltip
            hasArrow
            isOpen={isOpen}
            shift={{ padding: { left: 10 } }}
            zIndex={zIndices.navigationBar}
            content={
                <Notification>
                    <Content>
                        <Icons>
                            <IconContainer>
                                <Icon size={16} icon="ASTERISK" color={theme.defaultInverted} />
                            </IconContainer>
                            <IconContainer>
                                <Icon size={16} icon="LINK" color={theme.defaultInverted} />
                            </IconContainer>
                        </Icons>
                        <Text>
                            <Translation id="TR_VIEW_ONLY_TOOLTIP_DESCRIPTION" />
                        </Text>
                    </Content>
                    <Button
                        variant="tertiary"
                        size="small"
                        onClick={handleClose}
                        data-testid="@viewOnlyTooltip/gotIt"
                    >
                        <Translation id="TR_GOT_IT_BUTTON" />
                    </Button>
                </Notification>
            }
        >
            {children}
        </Tooltip>
    );
};
