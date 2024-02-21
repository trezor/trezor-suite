import styled, { useTheme } from 'styled-components';
import { variables, H2, Button, Card, Icon } from '@trezor/components';
import { Translation } from 'src/components/suite';

const StyledCard = styled(Card)`
    width: 100%;
    margin-bottom: 48px;
    padding: 24px 28px 24px 18px;
    border-left: 10px solid ${({ theme }) => theme.TYPE_GREEN};
    box-shadow: 0 2px 5px 0 ${({ theme }) => theme.BOX_SHADOW_BLACK_20};
`;

const Heading = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const Title = styled(H2)`
    font-weight: 600;
    margin-bottom: 0;
`;

const Point = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: 500;
    text-align: center;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};

    & + & {
        margin-top: 10px;
    }
`;

const Dark = styled.span`
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
`;

const StyledIcon = styled(Icon)`
    margin-right: 16px;
`;

const Divider = styled.div`
    width: 100%;
    height: 1px;
    background: ${({ theme }) => theme.STROKE_GREY};
    margin: 16px 0 20px;
`;

interface TaprootBannerProps {
    onClose: () => void;
}

export const TaprootBanner = ({ onClose }: TaprootBannerProps) => {
    const theme = useTheme();

    return (
        <StyledCard data-test-id="@accounts/empty-account/taproot-account">
            <Heading>
                <Title>
                    <Translation id="TR_TAPROOT_BANNER_TITLE" />
                </Title>
                <Button
                    data-test-id="@accounts/empty-account/taproot-account/close"
                    variant="tertiary"
                    onClick={onClose}
                >
                    <Translation id="TR_GOT_IT" />
                </Button>
            </Heading>

            <Divider />
            <Point>
                <StyledIcon icon="CHECK" size={20} color={theme.TYPE_GREEN} />
                <Translation
                    id="TR_TAPROOT_BANNER_POINT_1"
                    values={{
                        strong: chunks => <Dark>{chunks}</Dark>,
                    }}
                />
            </Point>
            <Point>
                <StyledIcon icon="CHECK" size={20} color={theme.TYPE_GREEN} />

                <Translation
                    id="TR_TAPROOT_BANNER_POINT_2"
                    values={{
                        strong: chunks => <Dark>{chunks}</Dark>,
                    }}
                />
            </Point>
        </StyledCard>
    );
};
