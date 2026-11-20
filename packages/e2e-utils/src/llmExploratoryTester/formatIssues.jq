def format_issue:
  if .relevance == "uncertain" then
    "- **\(.id)** [\(.severity)] [relevance uncertain] \(.title)"
  else
    "- **\(.id)** [\(.severity)] \(.title)"
  end;

def section($heading; $issues):
  if ($issues | length) > 0 then
    "\n### \($heading)\n",
    ($issues[] | format_issue)
  else
    empty
  end;

(.issues | map(select(.relevance == "pr-related"))) as $pr_related |
(.issues | map(select(.relevance != "pr-related"))) as $other_observations |
section("PR-related"; $pr_related),
section("Other observations"; $other_observations)
