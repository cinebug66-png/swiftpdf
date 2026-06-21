import { useCallback, useEffect, useState } from "react";
import {
  getRemainingUses,
  recordSuccessfulUse,
  resetDailyUsageIfNeeded,
  USAGE_LIMITS_CHANGED_EVENT,
  USAGE_LIMITS_STORAGE_KEY,
  type UsageLimitToolKey,
} from "@/lib/daily-usage-limits";

export function useDailyUsageLimit(toolKey: UsageLimitToolKey) {
  const [remainingUses, setRemainingUses] = useState(() => getRemainingUses(toolKey));

  const refreshRemainingUses = useCallback(() => {
    resetDailyUsageIfNeeded();
    setRemainingUses(getRemainingUses(toolKey));
  }, [toolKey]);

  useEffect(() => {
    refreshRemainingUses();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === USAGE_LIMITS_STORAGE_KEY) {
        refreshRemainingUses();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(USAGE_LIMITS_CHANGED_EVENT, refreshRemainingUses);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(USAGE_LIMITS_CHANGED_EVENT, refreshRemainingUses);
    };
  }, [refreshRemainingUses]);

  const recordUse = useCallback(() => {
    const nextRemainingUses = recordSuccessfulUse(toolKey);
    setRemainingUses(nextRemainingUses);
    return nextRemainingUses;
  }, [toolKey]);

  return {
    remainingUses,
    canUse: remainingUses > 0,
    recordSuccessfulUse: recordUse,
  };
}
