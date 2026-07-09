"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { addWeeksToDate, getMonday, getWeekDays, getWeekLabel, toIsoDate } from "@/lib/dates/weekUtils";
import {
  canAutoApplyVoiceEdit,
  createVoiceUndoSnapshot,
  restoreVoiceUndoSnapshot,
  type PlanInputSource,
} from "@/lib/plan/voiceAutoApply";
import { useWorkouts } from "@/lib/storage/useWorkouts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { WeekNavigator } from "@/components/calendar/WeekNavigator";
import { ParsedPreview } from "@/components/plan-entry/ParsedPreview";
import type { PlanPreviewResult } from "@/types/commands";
import type { Workout } from "@/types/workout";
import { Check, Loader2, Mic, Sparkles, Undo2, X } from "lucide-react";

const raceDate = "2026-10-11";
const autoApplyPreferenceKey = "runplan-ai.voice-auto-apply.v1";

type VoiceState = "idle" | "listening" | "processing" | "applied" | "needs review" | "error";

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  [index: number]: {
    transcript: string;
  };
};

type SpeechRecognitionEventLike = Event & {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};

type SpeechRecognitionErrorEventLike = Event & {
  error: string;
};

type SpeechRecognitionLike = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognitionConstructor() {
  if (typeof window === "undefined") {
    return null;
  }

  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

function getVoiceStateLabel(voiceState: VoiceState) {
  if (voiceState === "idle") {
    return "Voice idle";
  }

  return `Voice ${voiceState}`;
}

export function PlanEntryBox() {
  const today = useMemo(() => new Date(), []);
  const currentWeekStart = useMemo(() => getMonday(today), [today]);
  const [weekStart, setWeekStart] = useState(currentWeekStart);
  const [inputText, setInputText] = useState("");
  const [parsedPlan, setParsedPlan] = useState<PlanPreviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [appliedMessage, setAppliedMessage] = useState<string | null>(null);
  const [autoApplyVoiceEdits, setAutoApplyVoiceEdits] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [speechSupported, setSpeechSupported] = useState<boolean | null>(null);
  const [voiceMessage, setVoiceMessage] = useState<string | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [undoSnapshot, setUndoSnapshot] = useState<Workout[] | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTranscriptRef = useRef("");
  const lastTranscriptRef = useRef("");
  const { workouts, saveWorkouts } = useWorkouts();

  const activeWeekStartDate = toIsoDate(weekStart);
  const weekLabel = getWeekLabel(weekStart);
  const visibleWeekDates = useMemo(
    () => new Set(getWeekDays(weekStart).map((day) => day.isoDate)),
    [weekStart]
  );
  const visibleWorkoutCount = workouts.filter((workout) =>
    visibleWeekDates.has(workout.date)
  ).length;

  useEffect(() => {
    setSpeechSupported(Boolean(getSpeechRecognitionConstructor()));

    const storedPreference = window.localStorage.getItem(autoApplyPreferenceKey);
    setAutoApplyVoiceEdits(storedPreference === "true");

    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  function handleAutoApplyPreferenceChange(enabled: boolean) {
    setAutoApplyVoiceEdits(enabled);
    window.localStorage.setItem(autoApplyPreferenceKey, String(enabled));
  }

  async function parsePlanUpdate(text: string, inputSource: PlanInputSource) {
    setError(null);
    setAppliedMessage(null);
    setParsedPlan(null);
    setUndoSnapshot(null);

    const trimmedInput = text.trim();

    if (!trimmedInput) {
      setError("Enter a plan update first.");
      if (inputSource === "voice") {
        setVoiceState("error");
      }
      return;
    }

    setIsParsing(true);
    if (inputSource === "voice") {
      setVoiceState("processing");
    }

    try {
      const response = await fetch("/api/parse-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputText: trimmedInput,
          activeWeekStartDate,
          existingWorkouts: workouts,
          raceDate,
        }),
      });

      const responseBody = await response.json();

      if (!response.ok) {
        setError(responseBody.error ?? "Could not parse the plan update.");
        if (inputSource === "voice") {
          setVoiceState("error");
        }
        return;
      }

      const nextParsedPlan = responseBody as PlanPreviewResult;

      if (
        canAutoApplyVoiceEdit({
          parsedPlan: nextParsedPlan,
          inputSource,
          autoApplyEnabled: autoApplyVoiceEdits,
        })
      ) {
        setUndoSnapshot(createVoiceUndoSnapshot(workouts));
        saveWorkouts(nextParsedPlan.updatedWorkouts);
        setVoiceState("applied");
        setAppliedMessage(`Applied: ${nextParsedPlan.previewSummary}`);
        return;
      }

      setParsedPlan(nextParsedPlan);
      if (inputSource === "voice") {
        setVoiceState("needs review");
      }
    } catch {
      setError("Could not reach the parser route.");
      if (inputSource === "voice") {
        setVoiceState("error");
      }
    } finally {
      setIsParsing(false);
    }
  }

  async function handleParse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await parsePlanUpdate(inputText, "manual");
  }

  function handleVoiceStart() {
    const SpeechRecognition = getSpeechRecognitionConstructor();

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setVoiceState("error");
      setVoiceMessage("Speech recognition is not available in this browser.");
      return;
    }

    if (voiceState === "listening") {
      recognitionRef.current?.stop();
      return;
    }

    recognitionRef.current?.abort();
    finalTranscriptRef.current = "";
    lastTranscriptRef.current = "";
    setVoiceTranscript("");
    setVoiceMessage(null);
    setError(null);
    setAppliedMessage(null);
    setParsedPlan(null);
    setUndoSnapshot(null);

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setVoiceState("listening");
      setVoiceMessage("Listening...");
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript ?? "";

        if (result.isFinal) {
          finalTranscriptRef.current = `${finalTranscriptRef.current} ${transcript}`.trim();
        } else {
          interimTranscript = `${interimTranscript} ${transcript}`.trim();
        }
      }

      const nextTranscript = `${finalTranscriptRef.current} ${interimTranscript}`.trim();
      lastTranscriptRef.current = nextTranscript;
      setVoiceTranscript(nextTranscript);
      setInputText(nextTranscript);
    };

    recognition.onerror = (event) => {
      setVoiceState("error");
      setVoiceMessage(`Voice input error: ${event.error}`);
    };

    recognition.onend = () => {
      const transcript = (finalTranscriptRef.current || lastTranscriptRef.current).trim();

      recognitionRef.current = null;

      if (!transcript) {
        setVoiceState((current) => (current === "error" ? "error" : "idle"));
        setVoiceMessage((current) => current ?? "No speech was captured.");
        return;
      }

      setVoiceMessage("Transcript captured.");
      void parsePlanUpdate(transcript, "voice");
    };

    try {
      recognition.start();
    } catch {
      setVoiceState("error");
      setVoiceMessage("Could not start speech recognition.");
    }
  }

  function handleApply() {
    if (!parsedPlan) {
      return;
    }

    if (!parsedPlan.canApply) {
      setError("Clarify this update before applying changes.");
      return;
    }

    saveWorkouts(parsedPlan.updatedWorkouts);
    setAppliedMessage("Changes saved to this device.");
    setParsedPlan(null);
  }

  function handleUndoVoiceApply() {
    if (!undoSnapshot) {
      return;
    }

    saveWorkouts(restoreVoiceUndoSnapshot(undoSnapshot));
    setUndoSnapshot(null);
    setAppliedMessage("Auto-applied voice change undone.");
    setVoiceState("idle");
  }

  function handleCancelPreview() {
    setParsedPlan(null);
    setAppliedMessage(null);
    setError(null);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 pb-28 pt-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Phase 4</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-normal">Plan</h1>
      </div>

      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="mb-3">
          <p className="text-sm font-medium text-muted-foreground">Active week</p>
          <p className="mt-1 text-lg font-semibold">{weekLabel}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {visibleWorkoutCount} planned days
          </p>
        </div>
        <WeekNavigator
          label={weekLabel}
          onPreviousWeek={() => setWeekStart((current) => addWeeksToDate(current, -1))}
          onNextWeek={() => setWeekStart((current) => addWeeksToDate(current, 1))}
          onToday={() => setWeekStart(currentWeekStart)}
        />
      </section>

      <form className="rounded-lg border bg-card p-4 shadow-sm" onSubmit={handleParse}>
        <label className="grid gap-2 text-sm font-medium">
          Plan update
          <div className="grid gap-2">
            <div className="flex items-start gap-2">
              <Textarea
                value={inputText}
                onChange={(event) => {
                  setInputText(event.target.value);
                  setVoiceState("idle");
                }}
                placeholder="Monday 5 easy, Wednesday 2 warmup 4 tempo 2 cooldown, Sunday off"
                className="min-h-36 text-base"
              />
              <Button
                type="button"
                variant={voiceState === "listening" ? "default" : "outline"}
                size="icon-lg"
                aria-label={voiceState === "listening" ? "Stop voice input" : "Start voice input"}
                title={
                  speechSupported === false
                    ? "Speech recognition is not available in this browser."
                    : "Start voice input"
                }
                disabled={speechSupported === false || isParsing}
                onClick={handleVoiceStart}
              >
                {voiceState === "listening" || voiceState === "processing" ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Mic className="size-4" aria-hidden="true" />
                )}
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
              <span aria-live="polite">{getVoiceStateLabel(voiceState)}</span>
              <label className="flex items-center gap-2 font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={autoApplyVoiceEdits}
                  onChange={(event) => handleAutoApplyPreferenceChange(event.target.checked)}
                  className="size-4 accent-primary"
                />
                Auto-apply safe voice edits
              </label>
            </div>
          </div>
        </label>

        {speechSupported === false ? (
          <p className="mt-3 rounded-md border bg-secondary p-3 text-sm leading-5">
            Speech recognition is not available in this browser. Text entry still works.
          </p>
        ) : null}

        {voiceTranscript ? (
          <p className="mt-3 rounded-md border bg-background p-3 text-sm leading-5">
            <span className="font-medium">Transcript:</span> {voiceTranscript}
          </p>
        ) : null}

        {voiceMessage ? (
          <p className="mt-3 text-sm leading-5 text-muted-foreground">{voiceMessage}</p>
        ) : null}

        {error ? (
          <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm leading-5 text-destructive">
            {error}
          </p>
        ) : null}

        {appliedMessage ? (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-md border bg-secondary p-3 text-sm leading-5">
            <p>{appliedMessage}</p>
            {undoSnapshot ? (
              <Button type="button" variant="outline" size="sm" onClick={handleUndoVoiceApply}>
                <Undo2 className="size-4" aria-hidden="true" />
                Undo
              </Button>
            ) : null}
          </div>
        ) : null}

        <Button type="submit" size="lg" className="mt-4 w-full" disabled={isParsing}>
          {isParsing ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="size-4" aria-hidden="true" />
          )}
          Parse update
        </Button>
      </form>

      {parsedPlan ? (
        <>
          <ParsedPreview parsedPlan={parsedPlan} />
          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" size="lg" onClick={handleCancelPreview}>
              <X className="size-4" aria-hidden="true" />
              Cancel
            </Button>
            <Button
              type="button"
              size="lg"
              onClick={handleApply}
              disabled={!parsedPlan.canApply}
            >
              <Check className="size-4" aria-hidden="true" />
              Apply
            </Button>
          </div>
        </>
      ) : null}
    </main>
  );
}
