# Mission 4 – Phase 1 Plan

## Goal and scope

Phase 1 turns the Phase 0 proposals into confirmed, amended or deferred decisions, each backed by one small piece of new evidence, ready for the review in the week of Nov 9.

Phase 0 produced a revised schema 0.1 and ten open questions (U1–U10). Phase 1 does not redesign the schema. Each teammate owns one research workstream, answers two or three open questions, and runs one cheap experiment from §16.2 of the explainer.

Capacity is the binding constraint. From Fri Oct 30 to Tue Nov 10 there are 8 working days. At 1 hour a day that is about 8 hours per person and 32 hours in total, of which roughly 2 hours each go to onboarding and syncs. Each workstream is therefore sized to about 6 hours of focused work.

Assumptions to confirm:

- The review is on Wed Nov 11. If it is later in the week, the extra days go to integration, not new scope.
- You act as lead and integrator, on top of the 4 × 1 hour.
- Teammates are called A, B, C and D below; replace with names.
- The schema snapshot (2026-10-23) and the 60-record sample (2026-10-22) are frozen as the Phase 1 baseline.

## Ground rules for working without blocking

Nobody waits on anybody because everyone works from the same frozen baseline and writes only in their own folder.

1. **Freeze the baseline.** Tag the repository today as `phase1-baseline`: schema 0.1 (2026-10-23), the 60 records, crosswalks, drafts and the validator. All experiments run against this tag.
2. **No direct schema edits.** Nobody changes the main schema during Phase 1. A proposed change is written as a decision record plus, if useful, a branch with the schema diff. You merge accepted changes once, on Nov 9.
3. **One folder per workstream.** `phase1/ws-a-standards/`, `ws-b-model/`, `ws-c-identity/`, `ws-d-evidence/`. Shared files are read-only.
4. **One decision record per open question.** Same template for everyone (see below), so the review reads as one document.
5. **Cross-workstream questions go in a shared issue, not a meeting.** Tag the other owner; answer within one working day. If no answer, keep going on the baseline assumption and note it.
6. **Work in 1-hour units.** Every task below fits in one sitting and ends with a commit or a note, so a missed day costs one hour, not momentum.

Decision record template (one page each):

| Part | What goes in it |
|---|---|
| Question | The U-number and the question in one line |
| Phase 0 proposal | What the explainer proposed, with section reference |
| New evidence | What was done in Phase 1 and the result, with numbers |
| Recommendation | Confirm, amend (say how) or defer (say until when) |
| Schema impact | None, or the exact field change and whether it is breaking |
| Needs from other missions | Who must agree, and what you will ask them |

## The four workstreams

Each workstream maps to one of the explainer's research workstreams, plus one that checks the Phase 0 evidence itself.

The work is split into four tickets, Ticket 1 to Ticket 4, one per workstream. The brief for each ticket is in [phase-1-spike-briefs.md](phase-1-spike-briefs.md).

| Ticket | Owner | Workstream | Open questions | Experiment | Deliverable by Nov 9 | Review buddy |
|---|---|---|---|---|---|---|
| 1 | A | Standards alignment | U7 (AI Catalog entry type or convertible), confirm SemVer/purl stances | E3: convert 10 manifests to an AI Catalog document | 1 decision record + conversion files + field-loss table | C |
| 2 | B | Metadata model | U4 (wrapper), U5 (abilities vocabulary), U10 ("declared none") | E6, scoped: draft abilities and input/output types for the 16 relevant capabilities | 3 decision records + drafted abilities | D |
| 3 | C | Identity and lifecycle | U2 (fold source into publications), U3 (id vs URN, who allocates), U6 (lifecycle declarations) | E5: re-snapshot the 60 records two weeks on | 3 decision records + drift report | A |
| 4 | D | Evidence and consumers | U1 (levels instead of fixed mandatory set), U8 (owner effort), U9 (do Missions 1, 2, 5 accept levels) | E2: second judge on J1 and J2; start E4 owner timing | 3 decision records + agreement scores + owner timings | B |

### A — Standards alignment (about 6 h)

- [ ] Read AI Catalog draft; list its required fields (1 h)
- [ ] Pick 10 manifests: 4 MCP, 2 npm, 2 skills, 1 plugin, 1 Docker (0.5 h)
- [ ] Write the manifest → AI Catalog mapping; convert the 10 (2 h)
- [ ] Table every field that is lost, renamed or needs a new extension (1 h)
- [ ] Decision record U7; note on SemVer and purl stances (1.5 h)

### B — Metadata model (about 6 h)

- [ ] For the 16 relevant capabilities, draft abilities and input/output media types from READMEs (3 h, AI-assisted is fine; mark every value as derived-heuristic)
- [ ] Re-run the J1 matcher with those fields added; does N3 and N4 precision rise? (1 h)
- [ ] Compare free text, A2A-style and OASF on 5 of them (1 h)
- [ ] Decision records U4, U5, U10 (1 h)

### C — Identity and lifecycle (about 6 h)

- [ ] Re-snapshot the 60 records on or after Nov 5 (two weeks after 2026-10-22) and run the validator (1 h)
- [ ] Report drift: versions, status, renames, new or missing publications (1.5 h)
- [ ] Prototype source folded into `publications[]` on 5 manifests; run validator and identity checks (1.5 h)
- [ ] Decision records U2, U3, U6; list the namespace-allocation options for Missions 5 and 2 (2 h)

### D — Evidence and consumers (about 6 h)

- [ ] Before reading §7.2–7.3: judge relevance for the J1 pools (N1–N4) and identity for the J2 pairs, blind (2.5 h)
- [ ] Compute agreement with the Phase 0 judgments; list disagreements (1 h)
- [ ] Ask 3–5 capability owners to fill setup and limitations for their own capability; record minutes taken (0.5 h to send; results arrive as they arrive)
- [ ] Short questions to Missions 1, 2 and 5 on levels; decision records U1, U8, U9 (2 h)

## Calendar

The only hard dependency is the Nov 9 merge; until then all four workstreams run side by side on the frozen baseline.

C's re-snapshot waits until Nov 5 so it lands two weeks after the original 2026-10-22 snapshot. D judges blind first, before reading the Phase 0 results.

## Onboarding and engagement

Give each person ownership of a real decision, not a task list: they present their own recommendation at the review.

**Pre-read** (after kickoff, Fri Oct 30 – Mon Nov 2, about 1.5 h). Everyone reads explainer §1, §2, §3, §7.0, §11 and §17, then answers the §18 quiz. Then each reads only their own sections:

| Owner | Own sections |
|---|---|
| A | §8 Standards landscape, §10.4 versions |
| B | §6 Existing formats, §9 What counts as one capability, §11.4 value states |
| C | §10 Identity and lifecycle, §13 Before and after |
| D | §4 Method, §5 Sample, §14 Limits. Not §7.2–7.3 until blind judging is done, or the second judgment is no longer independent |

**Kickoff** (Fri Oct 30, 30 min, first thing). You walk the one-page story (§17), each owner restates their question in their own words, and you agree the folder layout and the decision record template.

**Rhythm.**

- Daily async update in the team channel, two lines: what I did, what I am stuck on.
- Mid-point sync Wed Nov 4, 30 min: each owner shows one early result. This is where a misread question gets caught.
- Buddy review Fri Nov 6: each buddy reads the other's draft decision records and leaves comments. This keeps all four people aware of all four topics before the review.

Keep it light. Encourage AI help for drafting abilities, conversions and record summaries, but every value must keep its provenance tag. Credit each owner by name on their decision record in the review deck.

## Review package and agenda

The review asks for one decision per open question, so the package is the decision records plus a one-page summary of what changes in the schema.

**Package (sent Tue Nov 10):**

- One-page summary: a table of U1–U10 with recommendation (confirm / amend / defer) and owner
- The 10 decision records, in U-number order
- Proposed schema 0.1 diff on one branch, with schema-compat output showing which changes are breaking
- Experiment outputs: E2 agreement, E3 field-loss table, E5 drift report, B's precision re-run, any E4 timings so far
- Updated explainer sections where findings changed, marked with the new date

**Agenda (75 min):**

| Slot | Topic | Lead |
|---|---|---|
| 5 min | What Phase 1 set out to settle | You |
| 15 min | Is the Phase 0 evidence trustworthy? (E2, E5) | D, C |
| 15 min | Requiredness and completeness levels (U1, U8, U9) | D |
| 15 min | Identity and publications (U2, U3, U6) | C |
| 15 min | Model and standards (U4, U5, U7, U10) | B, A |
| 10 min | Decisions taken, what goes to Phase 2 | You |

Invite the Mission 1, 2, 3 and 5 contacts named in each record's "Needs from other missions" row; their agreement is what turns a proposal into a decision.

## Deferred to Phase 2, and risks

E1 (internal capabilities) is the biggest remaining unknown but needs 1–2 weeks and Missions 1 and 2, so Phase 1 only prepares it.

Deferred, with preparation in Phase 1:

- **E1:** D's questions to Missions 1 and 2 also ask for 10–20 internal capabilities to sample. Phase 2 starts with that list in hand.
- **E4 full results:** owner timings that arrive after Nov 9 feed Phase 2.
- **Namespace allocation process:** C lists the options; the choice needs Missions 5 and 2.

Risks:

| Risk | Fallback |
|---|---|
| 1 h a day is lost to other work for a few days | Tasks are 1-hour units; drop the last task of the workstream, never the decision record |
| D reads the Phase 0 results before judging | Give D the record pools without labels; you hold the Phase 0 judgments until D is done |
| Owners do not answer E4 in time | Report response rate and partial timings; that itself is evidence for U8 |
| C's U2 change conflicts with A's conversion | A converts the baseline; the field-loss table notes what U2 would change |
| Other missions do not reply before the review | Record the recommendation as "proposed, pending Mission N" and list it as a review action |
