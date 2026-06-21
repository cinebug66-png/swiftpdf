export const DAILY_FREE_USE_LIMIT = 3;
export const USAGE_LIMITS_STORAGE_KEY = "swiftpdf_usage_limits";
export const USAGE_LIMITS_CHANGED_EVENT = "swiftpdf:usage-limits-changed";

export const LIMITED_TOOL_KEYS = {
  pdfToWord: "pdfToWord",
  wordToPdf: "wordToPdf",
  compressPdf: "compressPdf",
  pdfToExcel: "pdfToExcel",
  protectPdf: "protectPdf",
  unlockPdf: "unlockPdf",
} as const;

export type UsageLimitToolKey =
  | (typeof LIMITED_TOOL_KEYS)[keyof typeof LIMITED_TOOL_KEYS]
  | (string & {});

export type DailyUsageData = {
  date: string;
  tools: Record<string, number>;
};

let memoryUsageData: DailyUsageData | null = null;

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createEmptyUsageData(): DailyUsageData {
  return {
    date: getLocalDateKey(),
    tools: {},
  };
}

function sanitizeUsageData(value: unknown): DailyUsageData {
  if (!value || typeof value !== "object") {
    return createEmptyUsageData();
  }

  const candidate = value as Partial<DailyUsageData>;
  const tools =
    candidate.tools && typeof candidate.tools === "object"
      ? Object.fromEntries(
          Object.entries(candidate.tools)
            .filter(([, count]) => typeof count === "number" && Number.isFinite(count))
            .map(([toolKey, count]) => [
              toolKey,
              Math.min(DAILY_FREE_USE_LIMIT, Math.max(0, Math.floor(count))),
            ]),
        )
      : {};

  return {
    date: typeof candidate.date === "string" ? candidate.date : getLocalDateKey(),
    tools,
  };
}

function readUsageData(): DailyUsageData {
  if (typeof window === "undefined") {
    return memoryUsageData ?? createEmptyUsageData();
  }

  try {
    const storedValue = window.localStorage.getItem(USAGE_LIMITS_STORAGE_KEY);
    memoryUsageData = storedValue
      ? sanitizeUsageData(JSON.parse(storedValue))
      : (memoryUsageData ?? createEmptyUsageData());
    return memoryUsageData;
  } catch {
    return memoryUsageData ?? createEmptyUsageData();
  }
}

function notifyUsageChanged(data: DailyUsageData) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<DailyUsageData>(USAGE_LIMITS_CHANGED_EVENT, {
      detail: data,
    }),
  );
}

function writeUsageData(data: DailyUsageData) {
  memoryUsageData = data;

  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(USAGE_LIMITS_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // If storage is unavailable, keep the tool usable instead of blocking processing.
  }

  notifyUsageChanged(data);
}

export function resetDailyUsageIfNeeded(): DailyUsageData {
  const usage = readUsageData();
  const today = getLocalDateKey();

  if (usage.date === today) {
    return usage;
  }

  const resetUsage: DailyUsageData = {
    date: today,
    tools: {},
  };
  writeUsageData(resetUsage);
  return resetUsage;
}

export function getRemainingUses(toolKey: UsageLimitToolKey) {
  const usage = resetDailyUsageIfNeeded();
  const successfulUses = usage.tools[toolKey] ?? 0;
  return Math.max(0, DAILY_FREE_USE_LIMIT - successfulUses);
}

export function canUseTool(toolKey: UsageLimitToolKey) {
  return getRemainingUses(toolKey) > 0;
}

export function recordSuccessfulUse(toolKey: UsageLimitToolKey) {
  const usage = resetDailyUsageIfNeeded();
  const successfulUses = usage.tools[toolKey] ?? 0;

  if (successfulUses >= DAILY_FREE_USE_LIMIT) {
    return 0;
  }

  const nextUsage: DailyUsageData = {
    ...usage,
    tools: {
      ...usage.tools,
      [toolKey]: successfulUses + 1,
    },
  };

  writeUsageData(nextUsage);
  return Math.max(0, DAILY_FREE_USE_LIMIT - nextUsage.tools[toolKey]);
}
