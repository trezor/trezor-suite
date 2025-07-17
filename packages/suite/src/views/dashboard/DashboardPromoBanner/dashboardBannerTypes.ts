export const dashboardBannerTypes = ['tex'] as const;
export type DashboardBannerType = (typeof dashboardBannerTypes)[number] | null;
