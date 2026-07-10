import type { CommandWorkoutPayload, PlanCommand, PlanCommandIntent } from "@/types/commands";
import type { WorkoutType } from "@/types/workout";

type QuickParseInput = {
  inputText: string;
};

const dayPattern = "monday|tuesday|wednesday|thursday|friday|saturday|sunday";
const dayRegex = new RegExp(`\\b(${dayPattern})\\b`, "gi");
const simpleMoveRegex = new RegExp(
  `^\\s*(?:move\\s+)?(${dayPattern})\\s+(?:to|->)\\s+(${dayPattern})\\s*$`,
  "i"
);
const simpleSwapRegex = new RegExp(
  `^\\s*(?:swap\\s+)?(${dayPattern})\\s+(?:and|with|&)\\s+(${dayPattern})\\s*$`,
  "i"
);
const simpleDeleteRegex = new RegExp(
  `^\\s*(?:delete|clear|remove|make|set)?\\s*(${dayPattern})\\s*(?:off|rest|empty)?\\s*$`,
  "i"
);
const restOnlyRegex = /^(?:off|rest|rest day)$/i;

const workoutTypeMatchers: Array<[RegExp, WorkoutType]> = [
  [/\blong(?:\s+run)?\b/i, "Long Run"],
  [/\brecovery\b/i, "Recovery"],
  [/\btempo\b/i, "Tempo"],
  [/\bthreshold\b/i, "Threshold"],
  [/\bmarathon\s+pace|\bmp\b/i, "Marathon Pace"],
  [/\bintervals?\b/i, "Intervals"],
  [/\btrack\b/i, "Track"],
  [/\bhill(?:s|\s+repeats?)?\b/i, "Hill Repeats"],
  [/\bprogression\b/i, "Progression"],
  [/\bfartlek\b/i, "Fartlek"],
  [/\brace\b/i, "Race"],
  [/\bshakeout\b/i, "Shakeout"],
  [/\bpeloton\b/i, "Peloton"],
  [/\bbike|cycling\b/i, "Bike"],
  [/\bcross(?:\s+training)?\b/i, "Cross Training"],
  [/\blift|strength\b/i, "Strength"],
  [/\beasy\b/i, "Easy"],
  [/\boff|rest\b/i, "Rest"],
];

const emptyDetails: CommandWorkoutPayload["details"] = {
  warmupMiles: null,
  cooldownMiles: null,
  tempoMiles: null,
  thresholdMiles: null,
  marathonPaceMiles: null,
  intervalReps: null,
  intervalDistance: null,
  intervalRecovery: null,
  paceStart: null,
  paceEnd: null,
  durationMinutes: null,
  description: null,
};

function titleCaseDay(day: string) {
  return `${day.charAt(0).toUpperCase()}${day.slice(1).toLowerCase()}`;
}

function createCommand(overrides: Partial<PlanCommand>): PlanCommand {
  return {
    intent: "UNKNOWN",
    confidence: 0.9,
    targetDayName: null,
    targetDate: null,
    sourceDayName: null,
    sourceDate: null,
    secondTargetDayName: null,
    secondTargetDate: null,
    scaleFactor: null,
    workouts: [],
    explanation: "",
    ambiguities: [],
    warnings: [],
    ...overrides,
  };
}

function createPayload(overrides: Partial<CommandWorkoutPayload>): CommandWorkoutPayload {
  const { details, ...restOverrides } = overrides;

  return {
    dayName: null,
    date: null,
    workoutType: null,
    title: null,
    miles: null,
    speedMiles: null,
    notes: null,
    ...restOverrides,
    details: {
      ...emptyDetails,
      ...details,
    },
  };
}

function inferWorkoutType(text: string, details: CommandWorkoutPayload["details"]) {
  for (const [matcher, workoutType] of workoutTypeMatchers) {
    if (matcher.test(text)) {
      return workoutType;
    }
  }

  if (details.tempoMiles !== null) {
    return "Tempo";
  }

  if (details.thresholdMiles !== null) {
    return "Threshold";
  }

  if (details.marathonPaceMiles !== null) {
    return "Marathon Pace";
  }

  return null;
}

function getMilesBeforeKeyword(text: string, keyword: string) {
  const match = text.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:mi(?:les?)?)?\\s+${keyword}\\b`, "i"));
  return match ? Number(match[1]) : null;
}

function getFirstMiles(text: string) {
  const match = text.match(/\b(\d+(?:\.\d+)?)\s*(?:mi(?:les?)?)?\b/i);
  return match ? Number(match[1]) : null;
}

function parseWorkoutText(dayName: string, text: string) {
  const trimmedText = text.trim().replace(/^[,:;-]+|[,:;-]+$/g, "").trim();

  if (!trimmedText || restOnlyRegex.test(trimmedText)) {
    return createPayload({
      dayName,
      workoutType: "Rest",
      title: "Off",
      miles: 0,
      speedMiles: 0,
    });
  }

  const details = {
    ...emptyDetails,
    warmupMiles: getMilesBeforeKeyword(trimmedText, "warm(?:up)?|up"),
    cooldownMiles: getMilesBeforeKeyword(trimmedText, "cool(?:down)?|down"),
    tempoMiles: getMilesBeforeKeyword(trimmedText, "tempo"),
    thresholdMiles: getMilesBeforeKeyword(trimmedText, "threshold"),
    marathonPaceMiles: getMilesBeforeKeyword(trimmedText, "marathon\\s+pace|mp"),
  };
  const segmentMiles =
    (details.warmupMiles ?? 0) +
    (details.cooldownMiles ?? 0) +
    (details.tempoMiles ?? 0) +
    (details.thresholdMiles ?? 0) +
    (details.marathonPaceMiles ?? 0);
  const workoutType = inferWorkoutType(trimmedText, details);
  const firstMiles = getFirstMiles(trimmedText);
  const miles = segmentMiles > 0 ? segmentMiles : firstMiles;
  const speedMiles =
    (details.tempoMiles ?? 0) +
    (details.thresholdMiles ?? 0) +
    (details.marathonPaceMiles ?? 0);

  if (!workoutType && miles === null) {
    return null;
  }

  return createPayload({
    dayName,
    workoutType: workoutType ?? "Easy",
    miles,
    speedMiles: speedMiles > 0 ? speedMiles : null,
    details,
  });
}

function splitWorkoutEntries(inputText: string) {
  const matches = Array.from(inputText.matchAll(dayRegex));

  if (matches.length === 0) {
    return [];
  }

  return matches.map((match, index) => {
    const nextMatch = matches[index + 1];
    const start = match.index ?? 0;
    const contentStart = start + match[0].length;
    const end = nextMatch?.index ?? inputText.length;

    return {
      dayName: titleCaseDay(match[0]),
      text: inputText.slice(contentStart, end),
    };
  });
}

function parseStructuredWorkouts(inputText: string) {
  const entries = splitWorkoutEntries(inputText);

  if (entries.length === 0) {
    return null;
  }

  const workouts = entries.map((entry) => parseWorkoutText(entry.dayName, entry.text));

  if (workouts.some((workout) => workout === null)) {
    return null;
  }

  return createCommand({
    intent: "CREATE_OR_UPDATE_WORKOUTS",
    confidence: 0.92,
    workouts: workouts as CommandWorkoutPayload[],
    explanation: `${workouts.length} workout ${workouts.length === 1 ? "change" : "changes"} parsed instantly.`,
  });
}

export function parseQuickCommand({ inputText }: QuickParseInput) {
  const trimmedInput = inputText.trim();
  const moveMatch = trimmedInput.match(simpleMoveRegex);

  if (moveMatch) {
    return createCommand({
      intent: "MOVE_WORKOUT",
      confidence: 0.95,
      sourceDayName: titleCaseDay(moveMatch[1]),
      targetDayName: titleCaseDay(moveMatch[2]),
      explanation: "Move workout parsed instantly.",
    });
  }

  const swapMatch = trimmedInput.match(simpleSwapRegex);

  if (swapMatch) {
    return createCommand({
      intent: "SWAP_WORKOUTS",
      confidence: 0.95,
      targetDayName: titleCaseDay(swapMatch[1]),
      secondTargetDayName: titleCaseDay(swapMatch[2]),
      explanation: "Swap workouts parsed instantly.",
    });
  }

  const deleteMatch = trimmedInput.match(simpleDeleteRegex);

  if (deleteMatch && /delete|clear|remove|off|rest|empty/i.test(trimmedInput)) {
    const targetDayName = titleCaseDay(deleteMatch[1]);
    const intent: PlanCommandIntent = /off|rest/i.test(trimmedInput)
      ? "CREATE_OR_UPDATE_WORKOUTS"
      : "DELETE_WORKOUT";

    return createCommand({
      intent,
      confidence: 0.95,
      targetDayName,
      workouts:
        intent === "CREATE_OR_UPDATE_WORKOUTS"
          ? [
              createPayload({
                dayName: targetDayName,
                workoutType: "Rest",
                title: "Off",
                miles: 0,
                speedMiles: 0,
              }),
            ]
          : [],
      explanation: intent === "DELETE_WORKOUT" ? "Clear workout parsed instantly." : "Rest day parsed instantly.",
    });
  }

  return parseStructuredWorkouts(trimmedInput);
}
