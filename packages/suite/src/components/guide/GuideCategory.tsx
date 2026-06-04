import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { Column, Paragraph } from '@trezor/components';

import { setView } from 'src/actions/suite/guideActions';
import {
    GuideCategories,
    GuideContent,
    GuideHeader,
    GuideNode,
    GuideViewWrapper,
} from 'src/components/guide';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { getNodeTitle } from 'src/utils/suite/guide';

const Section = styled.div`
    margin-bottom: 20px;

    &:not(:last-of-type) {
        margin-bottom: 100px;
    }
`;

export const GuideCategory = () => {
    const currentNode = useSelector(state => state.guide.currentNode);
    const language = useSelector(selectLanguage);
    const dispatch = useDispatch();

    if (!currentNode || currentNode.type === 'page') {
        return null;
    }

    const title = getNodeTitle(currentNode, language);

    // Right now we support only 2 levels of categories
    // Level 1 category has its own view
    // Level 2 category is part of level 1 category view
    const pages = currentNode.children.filter(child => child.type === 'page');
    const subcategories = currentNode.children.filter(child => child.type === 'category');

    const goBack = () => dispatch(setView('GUIDE_DEFAULT'));

    return (
        <GuideViewWrapper>
            <GuideHeader back={goBack} label={title} />
            <GuideContent>
                {pages.length ? (
                    <Section>
                        <Paragraph
                            as="h3"
                            typographyStyle="body-sm-strong"
                            padding={{ bottom: 16 }}
                        >
                            <Translation id="TR_GUIDE_ARTICLES" />
                        </Paragraph>
                        <Column gap={12} data-testid="@guide/nodes">
                            {pages.map(page => (
                                <GuideNode key={page.id} node={page} />
                            ))}
                        </Column>
                    </Section>
                ) : null}
                {subcategories.length
                    ? subcategories.map(subcategory =>
                          subcategory.type === 'category' ? (
                              <GuideCategories
                                  key={subcategory.id}
                                  node={subcategory}
                                  label={getNodeTitle(subcategory, language)}
                              />
                          ) : null,
                      )
                    : null}
            </GuideContent>
        </GuideViewWrapper>
    );
};
