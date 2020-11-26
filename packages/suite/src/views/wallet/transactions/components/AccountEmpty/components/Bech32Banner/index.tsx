import React from 'react';
import styled from 'styled-components';
import { variables, H2, Button, Card, Icon, useTheme } from '@trezor/components';
import { Translation } from '@suite-components';

const StyledCard = styled(Card)`
    width: 100%;
    margin-bottom: 48px;
    padding: 24px 28px 24px 18px;
    border-left: 10px solid ${props => props.theme.TYPE_GREEN};
    box-shadow: 0 2px 5px 0 ${props => props.theme.BOX_SHADOW_BLACK_20};
`;

const Heading = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const Title = styled(H2)`
    font-weight: 600;
    margin-bottom: 0px;
`;

const Point = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: 500;
    text-align: center;
    color: ${props => props.theme.TYPE_LIGHT_GREY};

    & + & {
        margin-top: 10px;
    }
`;

const Dark = styled.span`
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

const StyledIcon = styled(Icon)`
    margin-right: 16px;
`;

const Divider = styled.div`
    width: 100%;
    height: 1px;
    background: ${props => props.theme.STROKE_GREY};
    margin: 16px 0px 20px 0px;
`;

interface Props {
    onClose: () => any;
}

const Bech32Banner = (props: Props) => {
    const theme = useTheme();
    return (
        <StyledCard>
            <Heading>
                <Title>
                    <Translation id="TR_BECH32_BANNER_TITLE" />
                </Title>
                <Button variant="tertiary" onClick={props.onClose}>
                    <Translation id="TR_GOT_IT" />
                </Button>
            </Heading>

            <Divider />
            <Point>
                <StyledIcon icon="CHECK" size={20} color={theme.TYPE_GREEN} />
                <Translation
                    id="TR_BECH32_BANNER_POINT_1"
                    values={{
                        strong: chunks => <Dark>{chunks}</Dark>,
                    }}
                />
            </Point>
            <Point>
                <StyledIcon icon="CHECK" size={20} color={theme.TYPE_GREEN} />

                <Translation
                    id="TR_BECH32_BANNER_POINT_2"
                    values={{
                        strong: chunks => <Dark>{chunks}</Dark>,
                    }}
                />
            </Point>
        </StyledCard>
    );
};

export default Bech32Banner;
