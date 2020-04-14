import React, { useState } from 'react';
import styled from 'styled-components';
import { Card, Translation } from '@suite-components';
import { isToday, format } from 'date-fns';
import { colors, Button, variables, Icon } from '@trezor/components';
import { useFetchNews } from '@dashboard-hooks/news';

const StyledCard = styled(Card)`
    flex-direction: column;
    padding: 20px;
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
    padding: 20px 0;

    & + & {
        border-top: 2px solid ${colors.BLACK96};
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
    display: flex;
    align-items: center;
`;

const ReadMore = styled(CTAWrapper)`
    color: ${colors.BLACK17};
    margin: 10px 0 0 0;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};

    &:hover {
        text-decoration: underline;
    }
`;

const ReadMoreIcon = styled(Icon)`
    color: ${colors.BLACK17};
    padding-left: 4px;
`;

const getDate = (date: string) => {
    const dateObj = new Date(date);
    if (isToday(dateObj)) {
        return <Translation id="TR_TODAY" />;
    }
    return format(dateObj, 'MMM d');
};

export default ({ ...rest }: React.HTMLAttributes<HTMLDivElement>) => {
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
                                <Translation id="TR_READ_MORE" />
                                <ReadMoreIcon
                                    size={12}
                                    color={colors.BLACK0}
                                    icon="EXTERNAL_LINK"
                                />
                            </ReadMore>
                        </Right>
                    </Post>
                ))}
            </StyledCard>
            {posts.length > visibleCount && (
                <BottomAction>
                    <Button
                        variant="tertiary"
                        size="small"
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
