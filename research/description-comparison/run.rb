require "digest"
require "json"
require "pathname"
require "yaml"

ROOT = Pathname.new(__dir__).join("../..").expand_path
HERE = Pathname.new(__dir__)
SLUGS = %w[sql-review translator runbook-search playwright-mcp agent-eval-framework].freeze
VARIANTS = %w[free_text a2a_style oasf_inspired].freeze

def normalize(value)
  value.downcase.gsub(/[^a-z0-9]+/, " ").strip.gsub(/\s+/, " ")
end

def leaves(value, path, result)
  case value
  when Hash
    value.each { |key, child| leaves(child, "#{path}/#{key}", result) }
  when Array
    value.each_with_index { |child, index| leaves(child, "#{path}/#{index}", result) }
  when String, FalseClass, TrueClass
    result[path] = value.to_s
  else
    raise "Unexpected indexed value at #{path}: #{value.inspect}"
  end
end

def fields_for(variant, text)
  return { "paragraph" => text } if variant == "free_text"
  data = YAML.safe_load(text)
  fields = {}
  if variant == "a2a_style"
    raise "Unexpected A2A-style fields" unless data.keys.sort == %w[description inputs name outputs]
    leaves(data, "", fields)
  else
    %w[name description].each { |key| leaves(data.fetch(key), "/#{key}", fields) }
    data.fetch("mapped_skills").each_with_index do |skill, index|
      %w[taxonomy_path caption].each { |key| leaves(skill.fetch(key), "/mapped_skills/#{index}/#{key}", fields) }
    end
    custom = data.fetch("custom_details")
    %w[abilities inputs outputs use_cases constraints].each do |key|
      next unless custom.key?(key)
      leaves(custom[key], "/custom_details/#{key}", fields)
    end
  end
  fields
end

def divide(n, d)
  d.zero? ? nil : n.to_f / d
end

def measures(hits, relevant_total)
  relevant = hits.count { |hit| hit["label"] == "relevant" }
  partial = hits.count { |hit| hit["label"] == "partial" }
  {
    "retrieved" => hits.length, "relevant_retrieved" => relevant,
    "partial_retrieved" => partial, "false_positives" => hits.length - relevant,
    "relevant_total" => relevant_total,
    "precision" => divide(relevant, hits.length), "recall" => divide(relevant, relevant_total),
    "precision_at_1" => hits.empty? ? nil : (hits.first["label"] == "relevant" ? 1.0 : 0.0)
  }
end

def percentage(value)
  value.nil? ? "N/A" : format("%.1f%%", value * 100)
end

fingerprints = {}
needs_path = ROOT.join("research/structured-matching/needs.yaml")
[needs_path, HERE.join("run.rb"), HERE.join("experiment-method.md")].each do |path|
  fingerprints[path.relative_path_from(ROOT).to_s] = Digest::SHA256.file(path).hexdigest
end
paths = {}
indexes = VARIANTS.map { |variant| [variant, {}] }.to_h
names = {}
SLUGS.each do |slug|
  paths[slug] = {
    "free_text" => ROOT.join("ability-descriptions/capability-representations/free-text/#{slug}.txt"),
    "a2a_style" => ROOT.join("ability-descriptions/capability-representations/a2a-style/#{slug}.yaml"),
    "oasf_inspired" => HERE.join("oasf-inspired/#{slug}.yaml")
  }
  paths[slug].each do |variant, path|
    text = File.read(path, encoding: "UTF-8")
    fingerprints[path.relative_path_from(ROOT).to_s] = Digest::SHA256.hexdigest(text)
    indexes[variant][slug] = fields_for(variant, text)
  end
  a2a = YAML.safe_load(File.read(paths[slug]["a2a_style"]))
  oasf = YAML.safe_load(File.read(paths[slug]["oasf_inspired"]))
  raise "Names differ for #{slug}" unless a2a.fetch("name") == oasf.fetch("name")
  names[slug] = a2a.fetch("name")
end
needs = YAML.safe_load(File.read(needs_path)).fetch("needs")
raise "Expected 16 requests" unless needs.length == 16 && needs.map { |need| need["id"] }.uniq.length == 16
requests = needs.map do |need|
  relevant = need.fetch("relevant") & SLUGS
  partial = need.fetch("partial") & SLUGS
  variants = VARIANTS.map do |variant|
    ranking = SLUGS.map do |slug|
      evidence = {}
      need.fetch("terms").each do |term|
        phrase = normalize(term)
        matches = indexes[variant][slug].select do |_, text|
          " #{normalize(text)} ".include?(" #{phrase} ")
        end
        evidence[term] = matches unless matches.empty?
      end
      next if evidence.empty?
      label = relevant.include?(slug) ? "relevant" : (partial.include?(slug) ? "partial" : "not_relevant")
      { "id" => slug, "score" => evidence.length, "label" => label, "evidence" => evidence }
    end.compact.sort_by { |hit| [-hit["score"], hit["id"]] }
    [variant, { "metrics" => measures(ranking, relevant.length), "ranking" => ranking }]
  end.to_h
  need.merge("relevant" => relevant, "partial" => partial, "variants" => variants)
end
summary = VARIANTS.map do |variant|
  hits = requests.flat_map { |request| request["variants"][variant]["ranking"] }
  m = measures(hits, requests.sum { |request| request["relevant"].length })
  m.delete("precision_at_1")
  m["zero_relevant_requests_returning_results"] = requests.count do |request|
    request["relevant"].empty? && request["variants"][variant]["metrics"]["retrieved"] > 0
  end
  [variant, m]
end.to_h
result = {
  "protocol" => "existing-five-description-artifacts-v1",
  "candidate_count" => SLUGS.length, "query_count" => needs.length,
  "zero_relevant_query_count" => requests.count { |request| request["relevant"].empty? },
  "input_sha256" => fingerprints.sort.to_h, "summary" => summary, "requests" => requests
}
lines = [
  "# Measured Comparison: Five Existing Description Artifacts", "",
  "Generated by `ruby research/description-comparison/run.rb`. See [method](experiment-method.md), [complete evidence](experiment-results.json), and [qualitative comparison](results.md).",
  "Five candidates per approach, with the same 16 requests and the same lexical matcher. Original relevance judgments are restricted to these five candidates; requests with no relevant candidate remain negative controls.", "",
  "## Aggregate results", "",
  "| Approach | Returned pairs | Relevant pairs | Partial pairs | Strict precision | Recall | Zero-relevant requests returning results |",
  "| --- | --- | --- | --- | --- | --- | --- |"
]
summary.each do |variant, m|
  lines << "| #{variant} | #{m['retrieved']} | #{m['relevant_retrieved']} | #{m['partial_retrieved']} | #{percentage(m['precision'])} | #{percentage(m['recall'])} | #{m['zero_relevant_requests_returning_results']} |"
end
lines.concat(["", "Strict precision excludes partial matches. Recall excludes zero-relevant requests, which are not counted as successful retrievals. Counts are request-candidate pairs, not unique capabilities.", "",
  "All three approaches returned the same relevant-pair count and aggregate precision/recall. This run does not demonstrate a discovery advantage for any approach.",
  "#{result['zero_relevant_query_count']} of the 16 requests have no fully relevant candidate in this five-capability pool.", "",
  "## Explicit field coverage", "",
  "Counts reflect actual fields, not semantic extraction from prose. N/A means prose has no explicit port fields, not that it fails to describe the data. Typed ports are proposed representations, not verified contracts. Constraint counts are top-level custom constraint entries, not individual supported values.", "",
  "| Capability | Approach | Named inputs | Named outputs | Ports with type fields | Ports with inference flags | Mapped taxonomy nodes | Constraint entries |",
  "| --- | --- | --- | --- | --- | --- | --- | --- |"])
coverage = []
SLUGS.each do |slug|
  VARIANTS.each do |variant|
    if variant == "free_text"
      counts = { "inputs" => nil, "outputs" => nil, "typed_ports" => nil, "inference_flags" => nil, "taxonomy_nodes" => nil, "constraints" => nil }
    else
      data = YAML.safe_load(File.read(paths[slug][variant]))
      details = variant == "a2a_style" ? data : data.fetch("custom_details")
      ports = details.fetch("inputs") + details.fetch("outputs")
      counts = {
        "inputs" => details["inputs"].length, "outputs" => details["outputs"].length,
        "typed_ports" => ports.count { |port| port.is_a?(Hash) && port.key?("type") },
        "inference_flags" => ports.count { |port| port.is_a?(Hash) && port.key?("inferred") },
        "taxonomy_nodes" => (data["mapped_skills"] || []).length,
        "constraints" => (details["constraints"] || {}).length
      }
    end
    coverage << { "id" => slug, "variant" => variant }.merge(counts)
    lines << "| #{names[slug]} | #{variant} | #{counts.values.map { |value| value.nil? ? 'N/A' : value }.join(' | ')} |"
  end
end
result["explicit_field_coverage"] = coverage
File.write(HERE.join("experiment-results.json"), JSON.pretty_generate(result) + "\n")
lines.concat(["", "This structural inventory establishes that the existing OASF-inspired artifacts contain more explicit fields; it does not establish better interoperability or independently verified information.", "",
  "## Per-request metrics", "",
  "| Request | Approach | Returned | Relevant | Partial | Precision | Recall | Precision@1 |",
  "| --- | --- | --- | --- | --- | --- | --- | --- |"])
requests.each do |request|
  request["variants"].each do |variant, run|
    m = run["metrics"]
    lines << "| #{request['id']} | #{variant} | #{m['retrieved']} | #{m['relevant_retrieved']} | #{m['partial_retrieved']} | #{percentage(m['precision'])} | #{percentage(m['recall'])} | #{percentage(m['precision_at_1'])} |"
  end
end
lines.concat(["", "## Differences from free text", "",
  "Changes in the returned set (not just rank). Labels and exact matching values are retained in the JSON evidence.", ""])
changes = 0
requests.each do |request|
  original = request["variants"]["free_text"]["ranking"].map { |hit| hit["id"] }
  %w[a2a_style oasf_inspired].each do |variant|
    current = request["variants"][variant]["ranking"].map { |hit| hit["id"] }
    added, removed = current - original, original - current
    next if added.empty? && removed.empty?
    changes += 1
    lines << "- #{request['id']} / #{variant}: added #{added.empty? ? 'none' : added.map { |id| "`#{id}`" }.join(', ')}; removed #{removed.empty? ? 'none' : removed.map { |id| "`#{id}`" }.join(', ')}."
  end
end
lines << "No returned-set differences." if changes.zero?
lines.concat(["", "## Ranked results", ""])
requests.each do |request|
  lines.concat(["### #{request['id']}: #{request['request']}", "",
    "Relevant candidates: #{request['relevant'].empty? ? 'none' : request['relevant'].join(', ')}. Partial candidates: #{request['partial'].empty? ? 'none' : request['partial'].join(', ')}.", "",
    "**Ground-truth basis:** #{request['evidence']}", ""])
  request["variants"].each do |variant, run|
    lines << "**#{variant}**"
    if run["ranking"].empty?
      lines << "No matches."
    else
      run["ranking"].each_with_index do |hit, index|
        lines << "#{index + 1}. `#{hit['id']}`: #{hit['label']}; score #{hit['score']}; terms: #{hit['evidence'].keys.join(', ')}."
      end
    end
    lines << ""
  end
end
lines.concat(["## Interpretation", "",
  "The figures measure these existing artifacts with unequal information coverage, not the inherent quality of free text, A2A, or OASF. The OASF-inspired examples contain custom typed ports and constraints; the simplified A2A files contain fewer facts. Neither YAML set is a specification-conformance sample.",
  "",
  "All variants use literal term presence, including negative statements. A format that preserves a useful restriction can therefore score worse by mentioning a behavior it excludes. Returning a record is not a verified suitability or interoperability decision.",
  "",
  "No human-readability scores, authoring-time measurements, semantic matching, type checking, native contract validation, or runtime reuse tests were performed. These results cannot justify claiming that OASF provides the strongest interoperability or automated discovery.",
  "",
  "The 16 queries were inherited unchanged from the earlier experiment, but the pool is now five candidates. Do not compare these aggregate scores directly with the earlier 16-record scores. Requests and judgments were authored after the original drafts by one reviewer; this is exploratory, not held-out evaluation.", ""])
File.write(HERE.join("experiment-results.md"), lines.join("\n"))
summary.each do |variant, m|
  puts "#{variant}: #{m['relevant_retrieved']}/#{m['retrieved']} relevant; precision #{percentage(m['precision'])}; recall #{percentage(m['recall'])}"
end
