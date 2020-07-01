import React, { useState } from 'react';
import styled from 'styled-components';
import { Card, Translation } from '@suite-components';
import { isToday, format } from 'date-fns';
import { colors, Button, variables } from '@trezor/components';
import { useFetchNews } from '@dashboard-hooks/news';
import { CARD_PADDING_SIZE } from '@suite-constants/layout';

const StyledCard = styled(Card)`
    flex-direction: column;
    width: 100%;
`;

const Section = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
`;

const BottomAction = styled.div`
    display: flex;
    margin-top: 13px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    justify-content: center;
    color: ${colors.BLACK25};
`;

const Post = styled.div`
    display: flex;

    & + & {
        border-top: 2px solid ${colors.BLACK96};
    }

    &:not(:first-child) {
        padding-top: ${CARD_PADDING_SIZE};
    }

    &:not(:last-child) {
        padding-bottom: ${CARD_PADDING_SIZE};
    }

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        flex-direction: column;
    }
`;

const Left = styled.div`
    display: flex;
`;

const Right = styled.div`
    display: flex;
    padding-left: 16px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding-left: 0;
    }

    flex-direction: column;
`;

const Image = styled.img`
    width: 280px;
    height: 140px;
    border-radius: 2px;
    object-fit: cover;

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        width: 100%;
    }
`;

const Title = styled.div`
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${colors.BLACK0};
    margin-bottom: 2px;
`;

const Timestamp = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.BLACK25};
    margin: 10px 0;
`;

const Description = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.BLACK25};
`;

const CTAWrapper = styled.a`
    margin-top: 12px;
`;

const ReadMore = styled.a`
    display: flex;
    align-self: flex-start;
    color: ${colors.BLACK17};
    margin: 10px 0 0 0;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const getDate = (date: string) => {
    const dateObj = new Date(date);

    if (isToday(dateObj)) {
        return <Translation id="TR_TODAY" />;
    }
    return format(dateObj, 'MMM d');
};

const NewsFeed = ({ ...rest }: React.HTMLAttributes<HTMLDivElement>) => {
    const [visibleCount, incrementVisibleCount] = useState(3);
    const { posts, isError, fetchCount, incrementFetchCount } = useFetchNews();

    if (isError) return null;

    return (
        <Section {...rest}>
            <StyledCard title={<Translation id="TR_WHATS_NEW" />}>
                {posts.slice(0, visibleCount).map(item => (
                    <Post key={item.link}>
                        <Left>
                            <Image src={item.thumbnail} />
                        </Left>
                        <Right>
                            <CTAWrapper target="_blank" href={item.link}>
                                <Title>{item.title}</Title>
                            </CTAWrapper>
                            <Timestamp>{getDate(item.pubDate)}</Timestamp>
                            <Description>{item.description}</Description>
                            <ReadMore target="_blank" href={item.link}>
                                <Button
                                    variant="tertiary"
                                    alignIcon="right"
                                    color={colors.BLACK0}
                                    icon="EXTERNAL_LINK"
                                >
                                    <Translation id="TR_READ_MORE" />
                                </Button>
                            </ReadMore>
                        </Right>
                    </Post>
                ))}
            </StyledCard>
            {posts.length > visibleCount && (
                <BottomAction>
                    <Button
                        variant="tertiary"
                        icon="ARROW_DOWN"
                        onClick={() => {
                            incrementVisibleCount(visibleCount + 3);
                            incrementFetchCount(fetchCount + 3);
                        }}
                    >
                        <Translation id="TR_SHOW_OLDER_NEWS" />
                    </Button>
                </BottomAction>
            )}
        </Section>
    );
};

export default NewsFeed;
