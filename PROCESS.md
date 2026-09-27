# Process overview

## What I built

An integrated ANU Student Portal — Today, Courses, Timetable, Assessments,
Results, Fees and Notices as one shell, with enrolling in or dropping a
course as the one genuinely full-stack write every other area reads through.

## How I got here

I brought in an idea myself: ANU's experience feels fragmented across
ANUHub, Canvas and MyTimetable, the way UTAS's doesn't. Checking it against
the brief surfaced the real risk — "build ANU's version of UTAS" meant
integrating three real backends with no student-facing API, exactly what
the brief warns against. My first correction narrowed to one small tool
(tutorial self-allocation); the right correction was realising breadth and
depth are separable — build all seven areas as one shell, but make only
enrolment (plus completing a task) a real write, with timetable, assessments
and fees reading through the same `enrolments` table rather than storing
their own copy of "what am I taking."

> Use enrolment as the main full-stack spine, but make the whole portal read
> from the same coherent student state, so other pages don't feel like
> disconnected mockups.

From there it was mechanical: schema and seed data
([`2f7f7f9`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-bobduke31/commit/2f7f7f9)),
the two write paths
([`ad559a1`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-bobduke31/commit/ad559a1)),
the seven-page shell
([`8e7b0eb`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-bobduke31/commit/8e7b0eb)),
then the spec test proving propagation over HTTP
([`edb8724`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-bobduke31/commit/edb8724)) —
full range
[`2f7f7f9...edb8724`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-bobduke31/compare/2f7f7f9...edb8724).
I directed the data model and propagation requirement; the agent built the
schema, the pages and the test. I fixed two seeded-data bugs the first test
run surfaced rather than loosen the assertions.

A later pass checked the frontend against real reference interfaces instead
of assumption: research into ANUHub, Canvas and MyTimetable's actual layouts
drove a restructure of each page's grouping (hub sections, per-course
grouping, a real timetable grid), and stripped developer-facing copy that
had leaked into the UI
([`b28393a`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-bobduke31/commit/b28393a)).
