# Security Specification - SB Milestone Scheduling Tool

## 1. Data Invariants
- Each user can only access their own profile, exhibitions, and milestones.
- The `ownerId` in every document must match the authenticated `request.auth.uid`.
- Dates must be strings in YYYY-MM-DD format.
- Timestamps (`updatedAt`) must be validated against `request.time`.
- Array sizes for `galleries`, `phaseTypes`, and `phases` must be capped to prevent resource exhaustion.

## 2. The "Dirty Dozen" Payloads
1. **Identity Spoofing**: Attempt to create an exhibition with an `ownerId` belonging to another user.
2. **Path Poisoning**: Attempt to use an extremely long or invalid string as a `{userId}` or `{exhibitionId}`.
3. **Invalid Status**: Attempt to set an exhibition status to a value not in the approved enum (e.g., "Deleted").
4. **Shadow Fields**: Attempt to add an `isAdmin: true` field to the `UserProfile`.
5. **Huge Array**: Attempt to save 1,000 galleries in the `UserProfile`.
6. **Date Format Attack**: Attempt to set a `startDate` as a long malicious script instead of a date string.
7. **Cross-User Read**: Attempt to read the exhibition list of another user.
8. **Unauthorized Update**: Attempt to update another user's museum name.
9. **Timestamp Manipulation**: Attempt to set `updatedAt` to a future date instead of the server time.
10. **Type Mismatch**: Attempt to set `durationMonths` in a phase to a string instead of a number.
11. **Negative Duration**: Attempt to set a phase duration to `-10`.
12. **Orphaned Write**: Attempt to create an exhibition without a corresponding user profile (logic-level check).

## 3. Test Runner
Refer to `firestore.rules.test.ts` for automated verification.
