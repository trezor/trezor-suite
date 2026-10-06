import { Locator, Page } from '@playwright/test';

import { step } from '../common';
import { expect } from '../testExtends/customMatchers';

export type ActivityTab = 'transactions' | 'all' | 'release-notes';

export type ToastActivityPreset =
    'tx-sent' | 'settings-applied' | 'device-wiped' | 'pin-changed' | 'backup-success';

export type EventActivityPreset = 'tx-received' | 'tx-confirmed';

export type ActivityPreset = ToastActivityPreset | EventActivityPreset;

export class ActivityPage {
    readonly activityMenuButton: Locator;
    readonly tabNavigation: Locator;
    readonly tabItem = (tab: ActivityTab): Locator =>
        this.page.getByTestId(`@notifications/menu/${tab}`);
    readonly unseenIndicator: Locator;
    readonly list: Locator;
    readonly unseenSection: Locator;
    readonly seenSection: Locator;
    readonly listItem = (preset: ActivityPreset): Locator =>
        this.page.getByTestId(`@activity/list/item/${preset}`);
    readonly unseenItem = (preset: ActivityPreset): Locator =>
        this.unseenSection.getByTestId(`@activity/list/item/${preset}`);
    readonly seenItem = (preset: ActivityPreset): Locator =>
        this.seenSection.getByTestId(`@activity/list/item/${preset}`);
    readonly emptyState: Locator;
    readonly emptyStateTitle: Locator;
    readonly debugBox: Locator;
    readonly debugPresetSelect: Locator;
    readonly debugPresetOption = (preset: ActivityPreset): Locator =>
        this.page.getByTestId(`@activity/debug/preset-select/option/${preset}`);
    readonly debugUnseenCheckbox: Locator;
    readonly debugUnseenCheckboxInput: Locator;
    readonly debugAddButton: Locator;

    constructor(private readonly page: Page) {
        this.activityMenuButton = this.page.getByTestId('@suite/menu/notifications');
        this.tabNavigation = this.page.getByTestId('@notifications/menu');
        this.unseenIndicator = this.page.getByTestId('@notifications/menu/unseen-dot');
        this.list = this.page.getByTestId('@activity/list');
        this.unseenSection = this.page.getByTestId('@activity/list/unseen');
        this.seenSection = this.page.getByTestId('@activity/list/seen');
        this.emptyState = this.page.getByTestId('@activity/empty');
        this.emptyStateTitle = this.page.getByTestId('@activity/empty/title');
        this.debugBox = this.page.getByTestId('@activity/debug/box');
        this.debugPresetSelect = this.page.getByTestId('@activity/debug/preset-select/input');
        this.debugUnseenCheckbox = this.page.getByTestId('@activity/debug/unseen-checkbox');
        this.debugUnseenCheckboxInput = this.debugUnseenCheckbox.locator('input');
        this.debugAddButton = this.page.getByTestId('@activity/debug/add-button');
    }

    @step()
    async navigateTo() {
        await this.activityMenuButton.click();
        await expect(this.tabNavigation).toBeVisible();
    }

    @step()
    async selectTab(tab: ActivityTab) {
        await this.tabItem(tab).click();
    }

    @step()
    async expandDebugSection() {
        if (await this.debugAddButton.isVisible()) return;

        await this.debugBox.click();
        await expect(this.debugAddButton).toBeVisible();
    }

    @step()
    async triggerActivity(preset: ActivityPreset, options: { unseen: boolean }) {
        await this.expandDebugSection();
        await this.page.selectDropdownOptionWithRetry(
            this.debugPresetSelect,
            this.debugPresetOption(preset),
        );

        if ((await this.debugUnseenCheckboxInput.isChecked()) !== options.unseen) {
            await this.debugUnseenCheckbox.click();
        }
        await expect(this.debugUnseenCheckboxInput).toBeChecked({ checked: options.unseen });

        await this.debugAddButton.click();
    }
}
