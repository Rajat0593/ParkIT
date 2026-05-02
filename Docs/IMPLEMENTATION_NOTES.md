# ParkIT Implementation Notes

**Last updated**: 2026-05-02

This doc captures the “why” and follow-up work that doesn’t belong in setup guides or in the roadmap.

## Search (mobile-first) notes

- The repo includes work around **ranking** and **client-side caching** for search flows (folded into this doc from prior progress notes).
- If you continue this effort, keep these constraints in mind:
  - **Correctness > clever ranking**: ensure filters and availability are accurate before re-ordering.
  - **Cache invalidation**: as soon as bookings or availability change, cached search results become stale unless you have server-driven invalidation.

## Recommended next improvements (high-signal)

1. **Testing + CI**
   - Add Jest/Supertest tests for backend critical endpoints.
   - Add React Native tests for Home/Search behavior.
2. **Geospatial query performance**
   - Verify PostGIS/GIST index usage for nearby search queries with `EXPLAIN ANALYZE`.
3. **Caching strategy**
   - Move from in-memory client cache to a backend cache (e.g., Redis) if you need cross-device consistency and invalidation.

## Operational notes

- Keep secrets in env vars (never commit `.env`).
- For production ops guidance, prefer `DEPLOYMENT_OPERATIONS_GUIDE.md` and treat it as the canonical operations doc.

