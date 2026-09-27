# Your harness

## What this project is

An integrated ANU Student Portal: one coherent surface over the things a
student currently has to chase across ANUHub, Canvas and MyTimetable
(courses, timetable, assessments, results, fees, notices). It is a
**consolidation and redesign of the existing ANU student experience**, not a
greenfield university platform — the entities, relationships and workflows
(enrolment, timetabling, assessment weighting, SSAF, census dates) should
stay recognisably ANU's, even where the specific rows are invented.

There is no real integration with ANUHub/Canvas/MyTimetable — they have no
student-facing API this prototype could call, and scraping behind ANU SSO is
not something to attempt. Seeded/mocked data stands in for what those
systems would supply.

## Scope discipline

Crit 7's brief explicitly warns against rebuilding the whole target system.
This project stays wide (courses, timetable, assessments, results, fees,
notices all render through the same shell) but only **one flow is genuinely
full-stack**: enrolling in or dropping a course. That single write is what
every other area reads through — Timetable, Assessments and Fees all derive
from `enrolments`, not from their own stored copy of "what am I taking."
Completing a task in the action queue is the second real write. Everything
else (assessments content, results, most notices, historical fee items) is
seeded, read-only data rendered through the same layout.

Do not:
- Add a second independent write path per domain (e.g. a separate "add
  assessment" or "edit result" flow) — that's the rebuild-the-whole-thing
  trap the brief calls out.
- Add real authentication. There is exactly one seeded student
  (`src/lib/seed.ts`); every query acts as that student.
- Let any page keep its own copy of enrolment state. If a page needs to know
  what the student is taking, it queries through `enrolments` — that's what
  makes the portal "integrated" rather than a shared nav bar over static
  pages.

## Working with the schema

`src/lib/schema.ts` is ground truth. To change it: edit the schema, run
`pnpm db:generate`, and commit both the schema change and the migration it
writes under `drizzle/`. Never edit the database by hand — migrations run at
boot (`src/lib/db.ts`) against whatever's on the Fly volume, so the migration
trail is what keeps a running deployment compatible with new code.

Seed data (`src/lib/seed.ts`) only runs once, against an empty database — it
is how a fresh volume gets a lived-in-looking account, not a fixture reset
mechanism. Don't call it from anywhere except `db.ts`'s boot path.

## Tests

`spec/portal.test.ts` is the contract that matters most here: it drives an
enrolment change over HTTP and asserts the effect shows up on Timetable,
Assessments, Fees and Notices, and survives a fresh page load — not just the
redirect response. Keep it green, and extend it (not a parallel test file)
if the spine grows another downstream effect.

## Process

Commit as the work actually happens, not as one dump at the end — the spec
checks for a commit history that grew with the work. Keep `PROCESS.md` and
`reflections/crit-7.md` current as you go rather than backfilling them at the
end.
