# ANU Student Portal

An integrated student portal for ANU, in the shape of the University of
Tasmania's student portal: one coherent surface for the things a student
regularly needs — courses and enrolment, timetable, assessments, results,
fees and notices — instead of chasing the same information across ANUHub,
Canvas and MyTimetable separately. It's a redesign of the existing student
experience, not a new university system: the entities and workflows
(enrolment, timetabling, assessment weighting, SSAF, census dates) are
grounded in how ANU actually works.

There's no login. The portal runs as a single seeded student
(`src/lib/seed.ts`), because building real authentication against ANU's
identity systems is out of scope for this prototype — the point being
demonstrated is information architecture and integration, not access
control.

## What good looks like here

A university system is mostly data and relationships (students, courses,
sessions, enrolments, assessments, fees), so the test of "integrated" isn't
a shared nav bar — it's whether one action's effects actually show up
everywhere they should. Enrolling in or dropping a course is that action: it
writes one row (`enrolments`), and Today, Courses, Timetable, Assessments,
Fees and Notices all read through it rather than keeping their own copy of
"what am I taking." Drop a course and it disappears from your timetable and
assessment list, and your fee estimate drops, in the same reload —
`spec/portal.test.ts` drives this over HTTP and checks it.

That's also where this prototype deliberately stops going deep. Assessment
content, past results, most notices and historical fee items are seeded,
read-only data — real ANU systems for entering marks, publishing results or
processing payments aren't things a one-week crit should attempt to rebuild,
and the brief says as much. The judgement call here is: **breadth of
surface, one genuine spine.** A portal that only modelled tutorial
allocation, say, would prove the full-stack mechanics without answering the
actual question this crit posed to me — what would it feel like if ANU's
systems were one thing instead of three. A portal that tried to fully wire
every domain would either not finish or would silently fake most of it,
which is worse than being honest about what's live.

Enrolling or dropping also broadcasts over the existing SSE stream
(`/api/events`), so a second open tab reflects the change without a manual
refresh — reused from the starter's guestbook plumbing rather than rebuilt.

What's enforced by `spec/`: the accessibility/structure invariants on every
page, the enrolment-propagation contract in `spec/portal.test.ts`, and that
this file is served in full at `/readme/`. What's a judgement call and not
mechanically checked: which six areas made the cut, how much of each is real
versus seeded, and where the line between "prototype" and "the whole ANU
backend" sits.
