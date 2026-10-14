import { type Locator, type Page, expect } from '@playwright/test';

import { step } from '../../common';
import { getRouteTestIdSegment } from '../../helpers/connectExplorer';

type ExplorerTheme = 'light' | 'dark' | 'system';

/**
 * A rendered navigation entry: the dynamic segment of its test ID, and the `href` it points at.
 * The `href` carries the deployment's `basePath` while the test ID does not, so entries are
 * re-located by segment and asserted against by `href`.
 */
export type SidebarEntry = { testIdSegment: string; href: string };

const SIDEBAR_LINK = /^@explorer\/sidebar\/link\//;

/**
 * The explorer renders its navigation tree twice: the sticky desktop sidebar, and a mobile menu
 * that only mounts below the `md` breakpoint and is revealed by the navbar hamburger. Both carry
 * the same route-keyed test IDs, so every entry locator here is chained to one of the two roots.
 */
export class SidebarSection {
    readonly container: Locator;
    readonly desktopMenu: Locator;
    readonly mobileMenu: Locator;
    readonly quickAccessSection: Locator;
    readonly coinMethodsSection: Locator;
    readonly commonMethodsSection: Locator;
    readonly miscellaneousSection: Locator;
    readonly coinSelect: Locator;
    readonly themeSwitch: Locator;
    // Entries read off the rendered tree already carry a test-ID segment, routes do not, so the
    // segment-taking locator is the primitive and the route-taking one converts on top of it.
    readonly desktopLinkBySegment = (testIdSegment: string): Locator =>
        this.desktopMenu.getByTestId(`@explorer/sidebar/link/${testIdSegment}`);
    readonly desktopLink = (route: string): Locator =>
        this.desktopLinkBySegment(getRouteTestIdSegment(route));
    readonly sectionLinks = (section: Locator): Locator => section.getByTestId(SIDEBAR_LINK);
    readonly mobileLink = (route: string): Locator =>
        this.mobileMenu.getByTestId(`@explorer/sidebar/link/${getRouteTestIdSegment(route)}`);
    readonly folder = (route: string): Locator =>
        this.desktopMenu.getByTestId(`@explorer/sidebar/folder/${getRouteTestIdSegment(route)}`);
    readonly folderToggle = (route: string): Locator =>
        this.desktopMenu.getByTestId(
            `@explorer/sidebar/folder-toggle/${getRouteTestIdSegment(route)}`,
        );
    readonly folderItems = (route: string): Locator =>
        this.desktopMenu.getByTestId(
            `@explorer/sidebar/folder-items/${getRouteTestIdSegment(route)}`,
        );
    // The coin and theme menus are portalled to `document.body`, so their options sit outside the
    // sidebar subtree and have to be located from the page root.
    readonly coinSelectOption = (networkRoute: string): Locator =>
        this.page.getByTestId(`@select-coin/option/${networkRoute}`);
    readonly themeSwitchOption = (theme: ExplorerTheme): Locator =>
        this.page.getByTestId(`@explorer/theme/switch/option/${theme}`);

    constructor(private readonly page: Page) {
        this.container = this.page.getByTestId('@explorer/sidebar/container');
        this.desktopMenu = this.page.getByTestId('@explorer/sidebar/menu-desktop');
        this.mobileMenu = this.page.getByTestId('@explorer/sidebar/menu-mobile');
        this.quickAccessSection = this.desktopMenu.getByTestId('@explorer/sidebar/quick-access');
        this.coinMethodsSection = this.desktopMenu.getByTestId('@explorer/sidebar/coin-methods');
        this.commonMethodsSection = this.desktopMenu.getByTestId(
            '@explorer/sidebar/common-methods',
        );
        this.miscellaneousSection = this.desktopMenu.getByTestId('@explorer/sidebar/miscellaneous');
        // A @trezor/components Select exposes its control as `<test-id>/input`.
        this.coinSelect = this.desktopMenu.getByTestId('@select-coin/input');
        // The theme switch also renders in the footer, hidden on pages that show the sidebar, so
        // it is addressed through the sidebar.
        this.themeSwitch = this.container.getByTestId('@explorer/theme/switch/input');
    }

    @step()
    async waitForTree() {
        await expect(this.desktopMenu).toBeVisible();
        await expect(this.sectionLinks(this.quickAccessSection)).not.toHaveCount(0);
    }

    @step()
    async getCoinMethodEntries(): Promise<SidebarEntry[]> {
        return await this.getSectionEntries(this.coinMethodsSection);
    }

    @step()
    async getCommonMethodEntries(): Promise<SidebarEntry[]> {
        return await this.getSectionEntries(this.commonMethodsSection);
    }

    @step()
    async getFolderItemEntries(folderRoute: string): Promise<SidebarEntry[]> {
        return await this.getSectionEntries(this.folderItems(folderRoute));
    }

    @step()
    async selectCoin(networkRoute: string) {
        await this.coinSelect.click();
        await this.coinSelectOption(networkRoute).click();
        await expect(this.coinSelectOption(networkRoute)).toBeHidden();
    }

    @step()
    async selectTheme(theme: ExplorerTheme) {
        await this.themeSwitch.click();
        await this.themeSwitchOption(theme).click();
        await expect(this.themeSwitchOption(theme)).toBeHidden();
    }

    /**
     * Clicks the folder's toggle icon. Clicking the row itself navigates when the folder has an
     * index page, which is a different interaction.
     */
    @step()
    async toggleFolder(route: string) {
        await this.folderToggle(route).scrollIntoViewIfNeeded();
        await this.folderToggle(route).click();
    }

    @step()
    async expandFolder(route: string) {
        if (await this.isFolderExpanded(route)) {
            return;
        }
        await this.toggleFolder(route);
        await expect(this.folder(route)).toHaveAttribute('aria-expanded', 'true');
    }

    // A collapsed folder keeps its entry list in the DOM, clipped to zero height by its animated
    // wrapper, so neither visibility nor viewport checks on the list tell open from closed.
    @step()
    async isFolderExpanded(route: string): Promise<boolean> {
        return (await this.folder(route).getAttribute('aria-expanded')) === 'true';
    }

    private async getSectionEntries(section: Locator): Promise<SidebarEntry[]> {
        await expect(this.sectionLinks(section)).not.toHaveCount(0);
        const links = await this.sectionLinks(section).all();
        const entries = await Promise.all(
            links.map(async (link): Promise<SidebarEntry | null> => {
                const [testId, href] = await Promise.all([
                    link.getAttribute('data-testid'),
                    link.getAttribute('href'),
                ]);

                return testId && href
                    ? { testIdSegment: testId.slice(testId.lastIndexOf('/') + 1), href }
                    : null;
            }),
        );

        return entries.filter((entry): entry is SidebarEntry => entry !== null);
    }
}
