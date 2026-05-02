# ParkIT Roadmap / Implementation Plan

**Last updated**: 2026-05-02  
**Purpose**: Track what to build next (not a long-form product pitch).

## Current state

- **Backend**: present and runnable locally (auth + core route groups + models)
- **Mobile**: present and runnable (core screens + API client integration)
- **Admin web**: present and runnable (core management pages + analytics)

For a feature-level snapshot, see `IMPLEMENTATION_SUMMARY.md`.

## Next priorities (ordered)

### 1) Backend completeness (CRUD + correctness)
- [ ] Implement missing controllers (spaces, bookings, vehicles, users) beyond templates
- [ ] Enforce authorization rules (roles, ownership)
- [ ] Validate inputs consistently and return stable error formats

### 2) Search quality + performance
- [ ] Confirm geospatial strategy (PostGIS vs non-PostGIS) and implement accordingly
- [ ] Add the right indexes and verify with `EXPLAIN ANALYZE`
- [ ] Add server-side pagination + filtering contracts that clients can rely on

### 3) Payments
- [ ] Implement payment initiation/verification flow (Stripe/Razorpay)
- [ ] Ensure idempotency and failure handling
- [ ] Model transaction states end-to-end (booking ↔ transaction)

### 4) Testing + CI
- [ ] Add backend Jest/Supertest tests for auth + one happy-path flow
- [ ] Add basic mobile/admin tests for critical UI flows
- [ ] Add CI workflow(s) to run tests on PRs

### 5) Deployment readiness
- [ ] Define environment configs (dev/staging/prod)
- [ ] Add monitoring/error reporting (Sentry etc.)
- [ ] Document backup/restore + basic runbooks

