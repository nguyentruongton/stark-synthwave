import React, { forwardRef, useEffect, useState, useMemo } from "react";
import {
  ScrollArea as M3ScrollArea,
  ScrollAreaProps,
  useMediaQuery,
  cn,
} from "@bug-on/m3-expressive";

export interface AdaptiveScrollAreaProps extends ScrollAreaProps {
  /**
   * Explicitly force native scrolling regardless of device type or viewport.
   * @default false
   */
  forceNative?: boolean;

  /**
   * Disable automatic fallback to native scroll on mobile/touch screens.
   * @default false
   */
  disableMobileNative?: boolean;

  /**
   * Custom CSS media query for mobile breakpoint.
   * @default "(max-width: 768px)"
   */
  mobileQuery?: string;
}

/**
 * AdaptiveScrollArea
 *
 * Integrates Material Design 3 Expressive's `ScrollArea` on desktop devices,
 * and automatically falls back to high-performance native scrolling on mobile
 * and touch-first devices.
 *
 * - Desktop: Renders M3 Expressive `ScrollArea` with custom styled scrollbar thumbs,
 *   state layers, and smooth transitions.
 * - Mobile: Renders native `overflow-y-auto` container with `-webkit-overflow-scrolling: touch`
 *   and `overscroll-contain` for authentic, lag-free momentum scrolling and gesture support.
 */
export const AdaptiveScrollArea = forwardRef<HTMLDivElement, AdaptiveScrollAreaProps>(
  (
    {
      className,
      viewportClassName,
      viewportProps,
      viewportRef,
      children,
      orientation = "vertical",
      type = "hover",
      scrollHideDelay = 600,
      forceNative = false,
      disableMobileNative = false,
      mobileQuery = "(max-width: 768px)",
      id,
      ...props
    },
    ref
  ) => {
    // 1. Detect viewport width synchronously when available
    const [isMobile, setIsMobile] = useState<boolean>(() => {
      if (typeof window === "undefined") return false;
      return window.matchMedia(mobileQuery).matches;
    });

    useEffect(() => {
      if (typeof window === "undefined") return;
      const mql = window.matchMedia(mobileQuery);
      const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
      setIsMobile(mql.matches);
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    }, [mobileQuery]);

    // 2. Detect touch capability / mobile device environment
    const [isTouchDevice, setIsTouchDevice] = useState<boolean>(() => {
      if (typeof window === "undefined") return false;
      return (
        "ontouchstart" in window ||
        (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0)
      );
    });

    useEffect(() => {
      if (typeof window === "undefined") return;
      const hasTouch =
        "ontouchstart" in window ||
        (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0);
      setIsTouchDevice(hasTouch);
    }, []);

    // 3. Determine if native scrolling should be used
    const shouldUseNative = useMemo(() => {
      if (forceNative) return true;
      if (disableMobileNative) return false;
      return isMobile || (isTouchDevice && isMobile);
    }, [forceNative, disableMobileNative, isMobile, isTouchDevice]);

    // Handle viewport ref forwarding for native mode
    const setRefs = (node: HTMLDivElement | null) => {
      if (typeof ref === "function") {
        ref(node);
      } else if (ref && "current" in ref) {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }

      if (typeof viewportRef === "function") {
        viewportRef(node);
      } else if (viewportRef && "current" in viewportRef) {
        (viewportRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    };

    // 4. Native scroll rendering for mobile
    if (shouldUseNative) {
      const getOverflowClasses = () => {
        switch (orientation) {
          case "horizontal":
            return "overflow-x-auto overflow-y-hidden [touch-action:pan-x]";
          case "both":
            return "overflow-auto [touch-action:pan-x_pan-y]";
          case "vertical":
          default:
            return "overflow-y-auto overflow-x-hidden [touch-action:pan-y]";
        }
      };

      return (
        <div
          ref={setRefs}
          id={id}
          className={cn(
            "relative w-full h-full overscroll-contain",
            "[-webkit-overflow-scrolling:touch]",
            getOverflowClasses(),
            className
          )}
          {...props}
        >
          <div
            className={cn(
              "w-full min-h-full",
              viewportClassName,
              viewportProps?.className
            )}
            {...viewportProps}
          >
            {children}
          </div>
        </div>
      );
    }

    // 5. Material Design 3 Expressive ScrollArea for desktop
    return (
      <M3ScrollArea
        ref={ref}
        id={id}
        type={type}
        orientation={orientation}
        scrollHideDelay={scrollHideDelay}
        className={cn("w-full h-full min-h-0", className)}
        viewportClassName={viewportClassName}
        viewportRef={viewportRef}
        viewportProps={viewportProps}
        {...props}
      >
        {children}
      </M3ScrollArea>
    );
  }
);

AdaptiveScrollArea.displayName = "AdaptiveScrollArea";

// Also export as ScrollArea for drop-in replacement convenience
export { AdaptiveScrollArea as ScrollArea };
