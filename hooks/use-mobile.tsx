/**
 * @fileoverview Mobile device detection hook using media queries.
 *
 * Provides a React hook that detects whether the viewport width is below the
 * mobile breakpoint (768px) and returns a reactive boolean value that updates
 * on viewport resize.
 *
 * @module hooks/use-mobile
 */

 import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * Hook that detects if the current viewport is mobile-sized
 *
 * Monitors viewport width and returns true if the current width is below the
 * mobile breakpoint (768px). The hook updates on viewport resize events and
 * handles cleanup properly.
 *
 * @returns {boolean} True if viewport width is less than 768px, false otherwise
 *
 * @example
 * // In a React component
 * const isMobile = useIsMobile();
 * return isMobile ? <MobileNav /> : <DesktopNav />;
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
