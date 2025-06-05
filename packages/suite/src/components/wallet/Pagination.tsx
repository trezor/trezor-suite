import { useForm } from 'react-hook-form';

import styled, { css } from 'styled-components';

import { Button, Row } from '@trezor/components';
import { NumberInput } from '@trezor/product-components';
import { borders, spacings, spacingsPx, typography } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { selectLanguage } from 'src/reducers/suite/suiteReducer';

const Wrapper = styled.div<{ $hasPages?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: ${$hasPages => ($hasPages ? spacingsPx.xs : spacingsPx.xxxs)};
`;

const PageItem = styled.div<{ $isActive?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    width: ${spacingsPx.xxl};
    height: ${spacingsPx.xxl};
    padding: ${spacingsPx.xxs} ${spacingsPx.xs};
    background: ${({ $isActive, theme }) =>
        $isActive ? theme.backgroundSecondaryDefault : 'transparent'};
    text-align: center;
    color: ${({ $isActive, theme }) => $isActive && theme.textOnSecondary};
    border-radius: ${borders.radii.md};
    transition:
        background 0.15s ease-out,
        color 0.15s ease-out;
    ${typography.hint};
    cursor: pointer;

    ${({ $isActive, theme }) =>
        !$isActive &&
        css`
            &:hover {
                background: ${theme.backgroundTertiaryDefaultOnElevation0};
                color: ${theme.textOnTertiary};
            }
        `};
`;

const Ellipsis = styled(PageItem)`
    cursor: default;

    &:hover {
        background: transparent;
        color: inherit;
    }
`;

const Actions = styled.div<{ $isActive: boolean }>`
    display: flex;
    visibility: ${props => (props.$isActive ? 'auto' : 'hidden')};
    ${typography.callout};
`;

export interface GetPagesProps {
    currentPage: number;
    totalPages: number;
}

export type Page = number | '...';

export const getPages = ({ currentPage: page, totalPages: total }: GetPagesProps): Page[] => {
    if (total <= 7) {
        return [...Array(total)].map((_, i) => i + 1);
    }

    if (page <= 4) {
        return [1, 2, 3, 4, 5, '...', total];
    }

    if (page >= total - 3) {
        return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }

    return [1, '...', page - 1, page, page + 1, '...', total];
};

interface PaginationProps {
    currentPage: number;
    isLastPage?: boolean;
    hasPages?: boolean;
    perPage: number;
    totalItems: number;
    explicitNavigation?: boolean;
    onPageSelected: (page: number) => void;
}

export const Pagination = ({
    currentPage,
    onPageSelected,
    hasPages = true,
    isLastPage,
    perPage,
    totalItems,
    explicitNavigation = false,
    ...rest
}: PaginationProps) => {
    const locale = useSelector(selectLanguage);

    const totalPages = Math.ceil(totalItems / perPage);
    const showPrev = currentPage > 1;
    const showNext = currentPage < totalPages;

    const { control, watch } = useForm({
        defaultValues: {
            pageInput: currentPage.toString(),
        },
    });

    const pageInput = watch('pageInput');

    const isPageInputInvalid =
        !Number.isInteger(Number(pageInput)) ||
        Number(pageInput) < 1 ||
        Number(pageInput) > totalPages;

    const pageNumbers = getPages({ currentPage, totalPages });

    const goToPage = () => {
        onPageSelected(Number(pageInput));
    };

    if (!hasPages) {
        return (
            <Wrapper $hasPages={hasPages} {...rest}>
                <Actions $isActive={showPrev}>
                    <Button
                        onClick={() => onPageSelected(currentPage - 1)}
                        icon="caretLeft"
                        iconAlignment="start"
                        variant="tertiary"
                    >
                        <Translation id="TR_PAGINATION_NEWER" />
                    </Button>
                </Actions>
                <Actions $isActive={!isLastPage}>
                    <Button
                        onClick={() => onPageSelected(currentPage + 1)}
                        icon="caretRight"
                        iconAlignment="end"
                        variant="tertiary"
                    >
                        <Translation id="TR_PAGINATION_OLDER" />
                    </Button>
                </Actions>
            </Wrapper>
        );
    }

    return (
        <Wrapper $hasPages={hasPages} {...rest}>
            <Actions $isActive={showPrev}>
                <PageItem onClick={() => onPageSelected(currentPage - 1)}>‹</PageItem>
            </Actions>

            {pageNumbers.map((page, index) =>
                page === '...' ? (
                    <Ellipsis key={`ellipsis-${index}`}>...</Ellipsis>
                ) : (
                    <PageItem
                        key={page}
                        data-testid={`@wallet/accounts/pagination/${page}`}
                        data-test-activated={page === currentPage}
                        onClick={() => (page !== currentPage ? onPageSelected(page) : {})}
                        $isActive={page === currentPage}
                    >
                        {page}
                    </PageItem>
                ),
            )}

            <Actions $isActive={showNext}>
                <PageItem onClick={() => onPageSelected(currentPage + 1)}>›</PageItem>
            </Actions>

            {explicitNavigation && (
                <Row alignItems="center" gap={spacings.sm} maxWidth="140px">
                    <NumberInput name="pageInput" control={control} locale={locale} size="small" />
                    <Button
                        variant="tertiary"
                        onClick={goToPage}
                        size="small"
                        isDisabled={isPageInputInvalid}
                    >
                        <Translation id="TR_PAGINATION_GO" />
                    </Button>
                </Row>
            )}
        </Wrapper>
    );
};
