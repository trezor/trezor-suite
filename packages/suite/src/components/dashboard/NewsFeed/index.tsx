import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Card from '@suite-components/Card';
import { colors, Button, variables } from '@trezor/components';
import { Translation } from '@suite-components/Translation';

const StyledCard = styled(Card)`
    flex-direction: column;
    width: 100%;
`;

const Section = styled.div`
    display: flex;
    width: 100%;
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

const Image = styled.img`
    width: 280px;
    height: 140px;
    border-radius: 2px;
    object-fit: cover;
`;

const Title = styled.div<{ visited: boolean }>`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${colors.BLACK0};
    margin-bottom: 2px;
`;

const Timestamp = styled.div<{ visited: boolean }>`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.BLACK25};
    margin-bottom: 5px;
`;

const Description = styled.div<{ visited: boolean }>`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.BLACK25};
`;

const CTAWrapper = styled.a`
    margin-top: 12px;
`;

const Error = styled.div`
    display: flex;
    padding: 24px;
    width: 100%;
    justify-content: center;
`;

export type Props = React.HTMLAttributes<HTMLDivElement>;

const NewsFeed = React.memo(({ ...rest }: Props) => {
    const [items, setItems] = useState<any[]>([]);
    const [itemsVisibleCount, incrementVisibleCount] = useState(3);
    const [fetchError, setFetchError] = useState(false);
    const [fetchCount, incrementFetchCount] = useState(4);

    useEffect(() => {
        const origin =
            !!process.env.DEV_SERVER === true || process.env.BUILD === 'development'
                ? // ? 'http://localhost:3003'
                  'https://staging-news.trezor.io'
                : 'https://news.trezor.io';

        fetch(`${origin}/posts?limit=${fetchCount}`)
            .then(response => response.json())
            .then(response => {
                if (response.length > 1) {
                    setItems(response);
                } else {
                    setFetchError(true);
                }
            })
            .catch(() => setFetchError(true));
    }, [fetchCount]);

    return (
        <Section {...rest}>
            <SectionHeader>
                <SectionTitle>
                    <Translation id="TR_WHATS_NEW" />
                </SectionTitle>
            </SectionHeader>
            <Content>
                <StyledCard>
                    {fetchError && (
                        <Error>
                            <Translation id="TR_DASHBOARD_NEWS_ERROR" />
                        </Error>
                    )}
                    {items.slice(0, itemsVisibleCount).map(item => (
                        <NewsItem key={item.link}>
                            <Left>
                                <Image src={item.thumbnail} />
                            </Left>
                            <Right>
                                <CTAWrapper target="_blank" href={item.link}>
                                    <Title visited={false}>{item.title}</Title>
                                </CTAWrapper>
                                <Timestamp visited={false}>{item.pubDate}</Timestamp>
                                <Description visited={false}>{item.description}</Description>
                                <CTAWrapper target="_blank" href={item.link}>
                                    <Button size="small" variant="tertiary">
                                        <Translation id="TR_READ_MORE" />
                                    </Button>
                                </CTAWrapper>
                            </Right>
                        </NewsItem>
                    ))}
                </StyledCard>
            </Content>
            {items.length > itemsVisibleCount && (
                <BottomAction>
                    <Button
                        variant="tertiary"
                        size="small"
                        icon="ARROW_DOWN"
                        onClick={() => {
                            incrementVisibleCount(itemsVisibleCount + 3);
                            incrementFetchCount(fetchCount + 3);
                        }}
                    >
                        <Translation id="TR_SHOW_OLDER_NEWS" />
                    </Button>
                </BottomAction>
            )}
        </Section>
    );
});

export default NewsFeed;
