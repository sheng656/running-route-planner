/**
 * Google Analytics 4 (GA4) Utility
 * Measurement ID: G-0L78LPK5DK
 */

export const GA_MEASUREMENT_ID = "G-0L78LPK5DK";

// Global project identifier for this site
const PROJECT_ID = "running_route_planner";

/**
 * Log a custom event to GA4
 * @param action - Event name
 * @param params - Additional event parameters
 */
export const trackEvent = (action: string, params: Record<string, any> = {}) => {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", action, {
      project_id: PROJECT_ID,
      ...params,
    });
  }
};

/**
 * Log route generation
 */
export const trackRouteGenerated = (distance: number, mode: string) => {
  trackEvent("route_generated", {
    distance: distance,
    mode: mode,
  });
};

/**
 * Log manual drawing start
 */
export const trackDrawingStart = () => {
  trackEvent("drawing_start");
};

/**
 * Log GPX export
 */
export const trackGPXExport = () => {
  trackEvent("gpx_export");
};
