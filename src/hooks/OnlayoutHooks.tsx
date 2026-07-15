import { useState, useCallback } from "react";
import { adjustSizeToResolveZoomInIssue } from "../utils/Helper";

export function useContainerDimensions() {
  const [containerDimensions, setDimensions] = useState({
    width: 0,
    height: 0,
    baseSize: 0,
  });

  const onLayout = useCallback((event: any) => {
    const { width, height } = event.nativeEvent.layout;

    requestAnimationFrame(() => {
      setDimensions({
        width: adjustSizeToResolveZoomInIssue(width),
        height: adjustSizeToResolveZoomInIssue(height),
        baseSize: adjustSizeToResolveZoomInIssue(Math.min(width, height)),
      });
    });
  }, []);

  return { containerDimensions, onLayout };
}
