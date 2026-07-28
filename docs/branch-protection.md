# Branch Protection

Require pull requests before merging into:

- `develop`
- `release/**`
- `main`

Required frontend check:

- `Frontend Quality`

Recommended settings:

- require branches to be up to date before merge;
- require conversation resolution;
- block force pushes and deletions on protected branches;
- allow deployment workflows only after AWS runtime, frontend hosting, environment promotion, and
  rollback runbooks are approved.
