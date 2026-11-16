# Decision C9 / U2: `source` and `publications`

| | |
|---|---|
| Date | 2026-11-16 |
| Decision | **Option A, with rules.** `source` is the canonical origin; `publications` are what adopters obtain. A fact is recorded once |
| Decided by | Mission 4 team, on the evidence below |
| Affects | Every manifest; how Missions 1, 2, 3, and 5 read "where it lives" and "where to get it" |
| Schema impact | None to the structure. Clarified descriptions, and one new validator warning (`PUBLICATION_REPEATS_SOURCE`) |

## 1. The question

Both fields hold locations, and in some manifests they hold the same URL. Is one of them redundant,
and which one is the truth? The answer matters to every mission: Mission 2 recognises a capability
by these fields, Mission 1 tells adopters where to get it, Mission 3 judges who maintains it and
what will run, and Mission 5 asks contributors for them.

## 2. What the 22 manifests show

Every manifest has exactly one `source`, always a repository, with its forge id. Publications
vary:

| Group | Manifests | `source` | `publications` | Overlap |
|---|---|---|---|---|
| A. Distributed through packages, images, registries, or hosted endpoints | 14: brave-search, browser-use, chrome-devtools, docling, exa, github-mcp, langchain-tavily, mcp-atlassian, pdf-parse, pdfplumber, playwright-mcp, tavily-mcp, unstructured, caveman-plugin | The GitHub repository | 1-3 channels each: npm, PyPI, container images, MCP Registry entries, hosted endpoints, a plugin marketplace | **None.** No publication repeats the repository |
| B. Used directly from the repository, with a ref | 3: claude-code-action (`v1`, tag), pr-agent (`main`, floating), webapp-testing (`main`, floating) | The repository | The repository, or the skill folder in it, with the ref adopters pin | Same location, **different fact**: the ref |
| C. Used directly from the repository, without a ref | 5: caveman, caveman-commit, caveman-review, megacave, ultracave | The repository, with `path` and `updatedAt` | The skill folder, `unversioned`, with the same `updatedAt` | **Pure repetition**: same location, same date, nothing new |

So the two fields look the same in 8 manifests, but in only 5 do they actually say the same thing.
Those 5 also contradicted group B: webapp-testing and the Caveman skills are used in the same way
(a folder on the `main` branch), yet one said `floating`/`main` and the other `unversioned`.

## 3. What each field holds that the other cannot

| Fact | Only in `source` | Only in `publications` |
|---|---|---|
| Who maintains it, and where | The canonical repository or provider | - |
| Identity across renames | `repositoryId` (caught 22 of 22 renames in T6) | - |
| Which part of a repository | `path` (without it, the 5 Caveman skills look like duplicates) | - |
| Health of the maintained code | `status` (archived?), `updatedAt` (latest push) | - |
| What an adopter installs or connects to | - | `kind` and `locator`: a package URL, an image, an endpoint, a marketplace entry |
| The version an adopter gets | - | `nativeVersion` and `versionScheme`, per channel; channels lag each other (3 of 22) |
| Health of each channel | - | `status` (deprecated on npm, yanked), `updatedAt` (latest publish) |
| Identity across channels | - | `locator` (caught 22 of 22 re-registrations in T6) |

The two fields answer different questions: **where is it maintained?** and **what do I install?**
For 14 of 22 the answers are different places. Neither field can be dropped without losing facts
that a mission needs.

## 4. The options, tested on the 22

| | A. `source` = origin, `publications` = channels (chosen) | B. Fold `source` into `publications`, one marked as the truth |
|---|---|---|
| Change to the 22 manifests | 5 small fixes (group C) | All 22: add a repository publication to the 14 in group A, plus a marker |
| Breaking | No | Yes: `source` is mandatory today |
| "Where do I get it?" (J3, T8) | Publications list only installable things | The 14 libraries and servers would list their repository as a channel, although nobody installs a PyPI library from GitHub. Recipes would offer `git clone` next to `pip install` |
| Identity (T6) | 66 of 66 correct | Unchanged in principle, but identity would hang on an optional list with a marker |
| A capability with no channel (an internal skill used from its repository) | `source` alone is valid | Needs an artificial publication |
| Mandatory anchor for Missions 2 and 5 | `source`, always present | One marked entry in an optional list |

Option B saves no information and loses a clear answer to "what do I install". Option A keeps both
answers and only needs a rule against repetition.

## 5. The decision, as rules

1. **`source` is mandatory and unique.** It is where the capability is maintained: a repository, a
   provider, or (only when no maintained source is visible) a registry entry. It carries the
   identity anchors (`url`, `path`, `repositoryId`) and the health of the maintained code
   (`status`, `updatedAt`).
2. **`publications` lists what adopters obtain**, each with its own version, status, and date.
3. **A repository is a publication only when adopters use it directly**: an Agent Skill copied
   from a folder, a CI action referenced by `owner/repo@ref`, a plugin installed from the
   repository. Then the publication states **the ref they pin**: `nativeVersion` with
   `versionScheme` `tag` (`v1`), `floating` (`main`), or `commit`.
4. **A fact is recorded once.** A repository publication that is the source repository (or a
   folder in it) and states no ref only repeats `source`. The validator reports it as
   `PUBLICATION_REPEATS_SOURCE` (warning). A date that equals `source.updatedAt` is not repeated
   in the publication.
5. **A different repository** (a mirror, a separate distribution repository) is a publication of
   its own and is not reported.

## 6. What was changed

| Change | Where |
|---|---|
| `source`, `publications`, and `publications[].kind` descriptions state the rules | `schema/0.1/capability.schema.json` (annotations only) |
| New warning `PUBLICATION_REPEATS_SOURCE` | `src/consistency.js`, with a test in `test/consistency.test.js` |
| The 5 Caveman skills now state `nativeVersion: main`, `versionScheme: floating`, and no repeated date | `case-studies/production-set/manifests/caveman/` |
| The Caveman fact check K1 checks the ref instead of the removed date | `case-studies/caveman/verify-facts.mjs` |

Result: 22 of 22 valid, 0 warnings. As a side effect, J3 "which version is current?" is now
answered for the 5 Caveman skills ("the `main` branch"), where before it was not answered at all.

## 7. How each mission reads the two fields

| Mission | Question | Read |
|---|---|---|
| Mission 1 | Where do I get it, and which version? | `publications` (kind, locator, nativeVersion); `source` only when there is no publication |
| Mission 2 | Is this the same capability as another entry? | `source.repositoryId` and `source.url` + `path`, and every `publications[].locator`. Never the name |
| Mission 3 | Who maintains it, is it still maintained, and what exactly will run? | `source` (owner's repository, `status`, `updatedAt`) for maintenance; the chosen publication (`nativeVersion`, `status`) for what runs |
| Mission 5 | What must a contributor give? | `source` always; `publications` for every channel they distribute through |
