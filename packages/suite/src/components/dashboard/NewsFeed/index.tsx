import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import Card from '@suite-components/Card';
import { colors, Button, variables } from '@trezor/components';
import { Translation } from '@suite-components/Translation';

const StyledCard = styled(Card)`
    flex-direction: column;
`;

const Section = styled.div`
    display: flex;
    flex-direction: column;
`;

const Content = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
`;

const SectionHeader = styled.div`
    display: flex;
    padding: 12px 0px;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
`;

const SectionTitle = styled.div`
    flex: 1;
    margin-bottom: 2px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-transform: uppercase;
    color: ${colors.BLACK50};
`;

const SectionAction = styled.div`
    font-size: 12px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.BLACK25};
`;

const BottomAction = styled.div`
    display: flex;
    margin-top: 13px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    justify-content: center;
    color: ${colors.BLACK25};
`;

const NewsItem = styled.div`
    display: flex;
    padding: 20px;

    & + & {
        margin-top: 1px solid ${colors.BLACK92};
    }
`;

const Left = styled.div`
    display: flex;
`;

const Right = styled.div`
    display: flex;
    padding-left: 16px;
    flex-direction: column;
`;

const NewsImage = styled.img`
    width: 280px;
    height: 140px;
    border-radius: 2px;
    object-fit: cover;
`;

const NewsTitle = styled.div<{ visited: boolean }>`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${props => (props.visited ? colors.BLACK25 : colors.BLACK0)};
    margin-bottom: 2px;
`;

const Timestamp = styled.div<{ visited: boolean }>`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${props => (props.visited ? colors.BLACK50 : colors.BLACK25)};
    margin-bottom: 5px;
`;

const Description = styled.div<{ visited: boolean }>`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${props => (props.visited ? colors.BLACK50 : colors.BLACK25)};
`;

const CTAWrapper = styled.a`
    margin-top: 12px;
`;

const CTAButton = styled(Button)``;

export type Props = React.HTMLAttributes<HTMLDivElement>;

const NewsFeed = React.memo(({ ...rest }: Props) => {
    const [items, setItems] = useState<any[]>([]);
    const [fetchError, setFetchError] = useState(false);

    useEffect(() => {
        const postCount = 3;
        const origin =
            !!process.env.DEV_SERVER === true || process.env.BUILD === 'development'
                ? 'https://staging-news.trezor.io'
                : 'https://news.trezor.io';
        axios
            .get(`${origin}/posts?limit=${postCount}`)
            .then(response => {
                setItems(response.data);
            })
            .catch(() => setFetchError(true));
    }, []);

    return (
        <Section {...rest}>
            <SectionHeader>
                <SectionTitle>
                    <Translation id="TR_WHATS_NEW" />
                </SectionTitle>
                <SectionAction>
                    <Button
                        variant="tertiary"
                        size="small"
                        icon="CHECK"
                        onClick={() => {
                            console.log('do something');
                        }}
                    >
                        <Translation id="TR_MARK_ALL_AS_READ" />
                    </Button>
                </SectionAction>
            </SectionHeader>
            <Content>
                {fetchError && 'Error while fetching the news'}
                <StyledCard>
                    {items.map(item => (
                        <NewsItem key={item.link}>
                            <Left>
                                <NewsImage src={item.thumbnail} />
                            </Left>
                            <Right>
                                <NewsTitle visited={false}>{item.title}</NewsTitle>
                                <Timestamp visited={false}>{item.pubDate}</Timestamp>
                                <Description visited={false}>{item.description}</Description>
                                <CTAWrapper href={item.link}>
                                    <CTAButton size="small" variant="tertiary">
                                        Read more
                                    </CTAButton>
                                </CTAWrapper>
                            </Right>
                        </NewsItem>
                    ))}
                </StyledCard>
            </Content>
            {/* <BottomAction>
                <Button
                    variant="tertiary"
                    size="small"
                    icon="ARROW_DOWN"
                    onClick={() => {
                        console.log('do something');
                    }}
                >
                    <Translation id="TR_SHOW_OLDER_NEWS" />
                </Button>
            </BottomAction> */}
        </Section>
    );
});

export default NewsFeed;
