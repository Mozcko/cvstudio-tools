# Security Policy

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report them privately through GitHub: go to the repository's **Security** tab and choose
**Report a vulnerability**
([direct link](https://github.com/Mozcko/cvstudio-tools/security/advisories/new)).

Include, as far as you can:

- what an attacker could do, and what they would need to do it;
- the page, request and response that show the problem;
- the commit or deployment you tested against.

Please do not access, change or delete data that is not yours while testing, and give us a
reasonable time to fix the problem before disclosing it.

You can expect an acknowledgement within a few days. We will keep you informed while we work on a
fix and credit you in the advisory unless you prefer otherwise.

Problems in the API, billing or AI services belong to the
[backend repository](https://github.com/Mozcko/cvstudio-tools-backend/security/advisories/new).

## Supported versions

Only the latest commit on `main` — the version that is deployed — receives security fixes.

## How the project guards against regressions

- Route protection rules and the Markdown/draft logic are covered by tests that run on every pull request.
- CodeQL scans the code on every pull request and once a week.
- CI reports known vulnerabilities in the dependencies; Dependabot proposes updates weekly.
