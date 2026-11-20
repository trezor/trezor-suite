def section($heading):
  if length > 0 then
    "\n### \($heading)\n",
    (.[] | "- **\(.id)** [\(.severity)]\(if .relevance == "uncertain" then " [relevance uncertain]" else "" end) \(.title)")
  else empty end;

(.issues | map(select(.relevance == "pr-related")) | section("PR-related")),
(.issues | map(select(.relevance != "pr-related")) | section("Other observations"))
