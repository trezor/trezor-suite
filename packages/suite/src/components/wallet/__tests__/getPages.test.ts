import { getPages } from '../Pagination';

describe('getPages', () => {
    it('should show all pages when there page count is less or equal to stride + 2', () => {
        const currentPage = 1;

        for (let totalPages = 1; totalPages <= 7; totalPages++) {
            const result = getPages({ currentPage, totalPages });
            expect(result).toEqual([...Array(totalPages)].map((_, i) => i + 1));
        }
    });

    it('should show first pages correctly when current page is near start', () => {
        const totalPages = 10;

        for (let currentPage = 1; currentPage < 5; currentPage++) {
            const result = getPages({ currentPage, totalPages });
            expect(result).toEqual([1, 2, 3, 4, 5, '...', 10]);
        }
    });

    it('should show last pages correctly when current page is near end', () => {
        const totalPages = 10;

        for (let currentPage = 7; currentPage <= totalPages; currentPage++) {
            const result = getPages({ currentPage, totalPages });
            expect(result).toEqual([1, '...', 6, 7, 8, 9, 10]);
        }
    });

    it('should show middle pages correctly', () => {
        const totalPages = 20;

        for (let currentPage = 5; currentPage <= 16; currentPage++) {
            const result = getPages({ currentPage, totalPages });
            expect(result).toEqual([
                1,
                '...',
                currentPage - 1,
                currentPage,
                currentPage + 1,
                '...',
                20,
            ]);
        }
    });
});
