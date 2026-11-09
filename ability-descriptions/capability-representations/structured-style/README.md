# Draft Ability Descriptions

This folder contains 16 YAML descriptions, one per metadata file under `../../../examples`, including the SQL Review revisions, duplicate-ID analytics fork, and intentionally invalid fixtures.

Each file provides `name`, `description`, `abilities`, typed `inputs` and `outputs`, and `use_cases`. `source_file` links the draft to its original metadata record; `source_context` preserves relevant fixture status and limitations. These drafts do not repair or replace the source manifests and are not capability-schema manifests.

Ability identifiers are curated kebab-case labels derived from described behavior, not published tool names. All `type` values are **proposed draft representations**, not verified interface schemas: `string` means text, `object` means a structured record, `array` means a collection, and `binary` means file/image bytes. Descriptions explain the intended contents. Published media types are included only where the source explicitly declares them.

[Ability Vocabulary](../../../research/ability-vocabulary.md) defines the standard labels used by all 16 drafts, equivalent wording, and normalization rules. Reuse these labels in `abilities`; keep domain, language, interface, and version details in the other fields.

The [discovery experiment](../../../research/structured-matching/README.md) compares these drafts against the same 16 original metadata records. [Results](../../../research/structured-matching/results.md) include strict precision, recall, rankings, and unsupported-request controls.

For each input/output, `inferred: false` means the source explicitly declares that interface port; `inferred: true` means the port is drafted from prose or likely behavior. Even an explicitly declared port has a proposed `type` unless its referenced contract is inspected. `use_cases_basis` distinguishes declared use cases from those inferred from descriptions. Inputs are conceptual data consumed by the ability, not a claim about required request fields; credentials and deployment configuration are not included.
