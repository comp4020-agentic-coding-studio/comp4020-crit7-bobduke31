# Process overview

## What I built

An integrated ANU Student Portal — Today, Courses, Timetable, Assessments,
Results, Fees and Notices as one shell, with enrolling in or dropping a
course as the one genuinely full-stack write every other area reads through.

## How I got here

I started from an idea I brought in myself: ANU's student experience feels
fragmented across ANUHub, Canvas and MyTimetable, where UTAS presents the
same kind of multiplicity through one student portal. Before writing any
code I asked the agent to research both systems and check the idea against
the published Crit 7 brief, rather than assume it was a good fit. That
research (not committed as code, so no citation here) surfaced the actual
risk: the brief explicitly warns against rebuilding a whole ANU system, and
"build ANU's version of the UTAS portal" read, literally, as integrating
three real backends with no student-facing API — not attemptable, and not
what the brief was asking for anyway.

My first instinct from that research was to narrow to one small tool
(tutorial/lab self-allocation). I proposed that as the direction; the
response was that the project should stay a complete, integrated portal, not
narrow to one feature, but should still respect scope by not rebuilding
every backend, and should read as a consolidation of ANU's real workflows
rather than a greenfield platform. That reframed the problem: breadth of
surface and depth of implementation are separable. The resolution was to
build all seven areas as one shell, but make only enrolment (plus completing
a task) a real write, with everything downstream of it — timetable,
assessments, fees — reading through the same `enrolments` table instead of
storing its own copy of "what am I taking."

From there it was mechanical: schema and seed data first
([`2f7f7f9`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-bobduke31/commit/2f7f7f9)),
then the two write paths
([`ad559a1`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-bobduke31/commit/ad559a1)),
then the seven-page shell reading through them
([`8e7b0eb`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-bobduke31/commit/8e7b0eb)),
then the spec test proving the propagation claim over HTTP rather than by
inspection
([`edb8724`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-bobduke31/commit/edb8724)).
Full range:
[`2f7f7f9...edb8724`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-bobduke31/compare/2f7f7f9...edb8724).

> Use enrolment as the main full-stack spine, but make the whole portal read
> from the same coherent student state. Changes such as enrolling in or
> dropping a course should meaningfully propagate through related areas like
> Today, Courses, Timetable, Assessments, Fees and Notices, so the other
> pages do not feel like disconnected mockups.

I directed the shape of the data model and the propagation requirement
myself (which table is the spine, which pages are allowed to be read-only,
that no page may keep its own enrolment state); the agent's contribution was
turning that into a concrete schema, the seven page implementations, and the
test that checks the propagation claim actually holds rather than just
looking right in one screenshot. I corrected two seeded-data bugs the first
test run surfaced — an assertion checking assessments propagation for a
course that had none seeded, and a hardcoded fee figure that didn't match
the actual multi-course total — by running the spec and fixing the
underlying seed/test mismatch rather than loosening the assertions.
