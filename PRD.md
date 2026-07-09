PRD.md

RunPlan AI — Product Requirements Document

1. Product Summary

RunPlan AI is a mobile-first training plan editor for runners preparing for a goal race. The app allows the user to create, update, and review upcoming training plans using natural language text input, with voice input added after text parsing is stable.

The product is not a GPS tracker, activity logger, social platform, gear tracker, or replacement for Strava/Garmin. It is a planning layer focused on future workouts, weekly mileage, workout mix, and race build visibility.

2. Product Goal

Enable a runner to quickly plan and edit upcoming training from an iPhone using natural language, then view the result in a clean weekly calendar with automatic mileage and workout-quality metrics.

3. Primary User

An experienced runner planning marathon training weeks in advance.

The user understands terms such as easy run, long run, tempo, threshold, intervals, cooldown, warmup, progression, cutback, and marathon pace.

4. Target Platform

Primary platform: iPhone Safari as a Progressive Web App.

The app must be installable from Safari using “Add to Home Screen.”

Desktop support is secondary.

5. Target Race

Default race: Chicago Marathon 2026
Race date: Sunday, October 11, 2026

The race should be configurable in the app settings.

6. Core User Jobs

6.1 Create a plan

The user enters:

“Monday five easy, Tuesday six, Wednesday two warm up four tempo two cool, Thursday Peloton, Friday five, Saturday fourteen long, Sunday off.”

The app parses the input into structured workouts and displays a confirmation preview before saving.

6.2 Edit a plan

The user enters:

“Move my long run from Saturday to Sunday.”

The app updates the relevant workouts, preserves workout details, and recalculates weekly metrics.

6.3 Replace a workout

The user enters:

“Change Wednesday to 8 by 800 with 2 warmup and 2 cooldown.”

The app replaces Wednesday’s workout and updates workout type, mileage, speed miles, and details.

6.4 Review training load

The user views weekly totals, speed-mile percentage, long-run percentage, and week-over-week mileage trend through race day.

7. Scope

7.1 In Scope for V1

* Mobile-first PWA
* Text-based natural language plan entry
* Manual workout editing
* Weekly Monday–Sunday calendar view
* Workout type classification
* Weekly mileage totals
* Speed miles percentage
* Long-run percentage
* Week-over-week mileage chart
* Race countdown
* Local persistence or database persistence
* Confirmation step before applying AI-parsed changes
* Basic validation and risk flags

7.2 Out of Scope for V1

* Strava integration
* Garmin integration
* Gear tracking
* Activity sync
* Fitness prediction
* AI-generated full training plans
* Multi-athlete coaching
* Native iOS App Store deployment
* Push notifications
* Apple Health integration
* Calendar export
* TrainingPeaks export
* Offline-first sync

8. Product Principles

1. The calendar is the source of truth.
2. Natural language is an editing interface, not the data source.
3. Every parsed update must be previewed before saving.
4. Weekly metrics must recalculate automatically after every change.
5. Mobile usability takes priority over desktop richness.
6. Avoid feature creep.
7. Do not invent workouts the user did not request.
8. Preserve user intent over rigid coaching logic.

9. Key Screens

9.1 Home / Current Week

Displays:

* Race name
* Race countdown
* Current training week
* Current week mileage
* Next workout
* Upcoming long run
* Weekly calendar cards

Primary actions:

* Add/update plan
* Edit workout
* Navigate weeks

9.2 Plan Entry

Displays:

* Text input box
* Optional microphone button in later version
* Parse button
* Parsed preview
* Apply changes button
* Cancel button

9.3 Weekly Calendar

Displays one week at a time, Monday through Sunday.

Each day card displays:

* Day name
* Date
* Workout type
* Mileage
* Short workout description
* Optional pace/workout details
* Status badge for rest, cross-training, strength, or quality workout

9.4 Workout Edit Sheet

Opened by tapping a workout card.

Editable fields:

* Date
* Workout type
* Total miles
* Speed miles
* Warmup miles
* Workout segment
* Cooldown miles
* Pace notes
* General notes
* Cross-training flag
* Strength flag
* Rest flag

9.5 Metrics

Displays:

* Weekly mileage trend chart
* Speed-mile percentage by week
* Long-run percentage by week
* Weekly summary table
* Risk flags

9.6 Settings

Displays:

* Race name
* Race date
* Default week start day, fixed to Monday for V1
* User pace notes, optional
* Data reset/export controls

10. Workout Types

Supported workout types:

* Easy
* Recovery
* Long Run
* Tempo
* Threshold
* Intervals
* Track
* Hill Repeats
* Marathon Pace
* Progression
* Fartlek
* Race
* Shakeout
* Peloton
* Bike
* Cross Training
* Strength
* Rest
* Custom

11. Workout Classification Rules

Running workouts count toward weekly mileage.

Cross-training, Peloton, bike, strength, and rest do not count toward weekly running mileage unless explicitly assigned running miles.

Speed miles include only quality portions of:

* Tempo
* Threshold
* Intervals
* Track
* Hill repeats
* Marathon pace
* Fartlek quality segments
* Progression quality segments

Warmup and cooldown miles do not count as speed miles.

The long run is either:

* A workout explicitly marked as Long Run, or
* The highest-mileage running day in the week if no workout is explicitly marked Long Run

If multiple workouts are marked Long Run, use the highest mileage workout for long-run percentage and flag the week for review.

12. Weekly Metrics

Weeks always run Monday through Sunday.

For each week, calculate:

Weekly Mileage

Sum of all running workout miles from Monday through Sunday.

Speed Miles

Sum of all quality-segment miles from qualifying workouts.

Speed Percentage

Speed miles divided by weekly mileage.

Long Run Miles

Mileage of the long run.

Long Run Percentage

Long run miles divided by weekly mileage.

Running Days

Count of days with running miles greater than zero.

Rest Days

Count of days marked Rest or Off.

Cross-Training Days

Count of days marked Bike, Peloton, or Cross Training.

Strength Days

Count of days marked Strength or containing a strength component.

Mileage Change Percentage

Current week mileage minus prior week mileage, divided by prior week mileage.

13. Risk Flags

The app should flag, but not block, the following:

* Weekly mileage increase greater than 15%
* Long run greater than 35% of weekly mileage
* Speed miles greater than 20% of weekly mileage
* No rest day in a week
* More than two quality sessions in a week
* Long run increase greater than 2 miles week over week
* Missing long run in marathon build
* Race week mileage unusually high

Flags should be informational, not prescriptive.

14. Natural Language Parsing Requirements

The parser must support:

Simple runs

“Monday five easy”
“Tuesday 6”
“Friday four recovery”

Long runs

“Saturday 14 long”
“Move long run to Sunday”

Tempo workouts

“Wednesday two warm up four tempo two cool”
“4 miles at tempo starting 6:30 cutting down to 6:15”

Intervals

“8 by 800”
“6x1k”
“4 by one mile with 400 jog”

Cross-training

“Thursday Peloton easy ride”
“Sunday bike or off”

Strength

“Friday four miles with 30 minute lift”

Rest

“Sunday off”
“Complete rest day”

Edits

“Change Tuesday to seven”
“Move Saturday to Sunday”
“Delete Friday”
“Make Thursday five easy instead of Peloton”
“Shift everything back one day”

15. AI Parser Output

The parser must return structured JSON only. It should not return prose.

Each parse result should include:

* Intent type
* Target dates or days
* Proposed workout changes
* Confidence score
* Ambiguity notes
* User-facing preview summary

The application must not apply changes automatically unless the user confirms.

16. Example Parse Output

{
  "intent": "create_or_update_week",
  "confidence": 0.94,
  "changes": [
    {
      "dayOfWeek": "Monday",
      "workoutType": "Easy",
      "miles": 5,
      "speedMiles": 0,
      "details": {
        "title": "5 Easy",
        "notes": ""
      }
    },
    {
      "dayOfWeek": "Wednesday",
      "workoutType": "Tempo",
      "miles": 8,
      "speedMiles": 4,
      "details": {
        "warmupMiles": 2,
        "tempoMiles": 4,
        "cooldownMiles": 2,
        "paceStart": "6:30",
        "paceEnd": "6:15"
      }
    }
  ],
  "previewSummary": "Creates a 38-mile week with 4 speed miles and a 14-mile long run.",
  "ambiguities": []
}

17. Validation Requirements

The app must prevent:

* Negative mileage
* Invalid dates
* Invalid race date
* Duplicate workout IDs
* Missing workout type
* Speed miles greater than total workout miles

The app should warn but allow:

* High mileage jumps
* High long-run percentage
* High speed percentage
* Missing rest day
* Multiple quality sessions

18. Data Persistence

V1 may use Supabase or local storage during early development.

Production V1 should use Supabase to support:

* Data persistence across devices
* Account-based plans
* Future expansion

19. Authentication

Authentication is optional for the first local prototype.

For deployed use, use Supabase Auth.

Minimum requirement:

* Email/password or magic link login

20. PWA Requirements

The app must include:

* Web app manifest
* Home screen icon
* Mobile-safe viewport
* Responsive layout
* Installable behavior
* App-like shell
* Proper theme color
* Offline fallback page preferred, not required for V1

21. Non-Functional Requirements

Performance

* Initial load under 3 seconds on modern iPhone
* Calendar navigation should feel instant
* Metrics should update immediately after saving

Usability

* Touch targets at least 44px
* No dense desktop tables on mobile
* One-handed use should be reasonable
* Primary actions should be reachable near bottom of screen

Reliability

* Parsed changes must be previewed
* User must be able to manually correct any AI mistake
* No destructive action without confirmation

Maintainability

* Strong TypeScript types
* Clear component boundaries
* Centralized calculation utilities
* Centralized workout classification logic
* Tests for metric calculations

22. Acceptance Criteria for V1

The app is considered V1 complete when the user can:

1. Open the app on iPhone from a Vercel URL.
2. Add it to the iPhone home screen.
3. Create a training week through text input.
4. Preview parsed workouts before saving.
5. View the week in a Monday–Sunday calendar.
6. Tap any workout and edit it manually.
7. See weekly mileage, speed percentage, and long-run percentage.
8. Navigate between weeks.
9. View a week-over-week mileage chart through race day.
10. Change an existing workout using natural language.
11. Save data persistently.
12. Avoid data loss after refresh.

23. Example User Flow

User opens app.

Home screen shows current week.

User taps “Update Plan.”

User enters:

“Monday 5, Tuesday 6, Wednesday 2 warmup 4 tempo from 6:30 to 6:15 and 2 cooldown, Thursday Peloton easy, Friday 5, Saturday 14 long, Sunday off.”

App parses input.

Preview shows:

* Monday: 5 Easy
* Tuesday: 6 Easy
* Wednesday: 8 Tempo
* Thursday: Peloton Easy Ride
* Friday: 5 Easy
* Saturday: 14 Long Run
* Sunday: Off

Metrics preview:

* Weekly mileage: 38
* Speed miles: 4
* Speed percentage: 10.5%
* Long-run percentage: 36.8%

User taps Apply.

Calendar updates.

Mileage chart updates.

Risk flag appears:
“Long run is 36.8% of weekly mileage, slightly above target range.”

24. Future Roadmap

Potential future features:

* Voice input
* Workout templates
* Training block views
* Race-specific taper logic
* Export to calendar
* Export to CSV
* Garmin/Strava planned workout sync
* TrainingPeaks export
* Multiple races
* Workout library
* AI workout suggestions
* Coach notes
* Offline-first editing
* Push reminders
* Native app using Expo or React Native

Do not implement roadmap features in V1 unless explicitly requested.