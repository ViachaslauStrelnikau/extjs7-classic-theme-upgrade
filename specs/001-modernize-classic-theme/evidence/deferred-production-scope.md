# Deferred Production Compatibility Scope

**Status**: Deferred to the next independent spec.
**Decision date**: 2026-10-23
**Approver**: Project owner
**Evidence ID**: `defer-production-inputs-to-next-spec-20261023`

This feature covers the existing `TestApp` demo. Do not collect or test production inputs here.
Demo evidence does not prove production compatibility. Keep production adoption blocked until the
next spec completes its checks.

Carry these items into the next independent production compatibility spec:

- Obtain production CSS, stylesheet order, theme package, and complete parent chain.
- Record production component and state inventories, selectors, and custom CSS inputs.
- Record required browsers, versions, viewports, fonts, and device pixel ratios.
- Map each production input to stable compatibility cases.
- Build, capture, compare, and roll back the production application with verified inputs.
- Record G0 and production acceptance decisions with linked evidence.
- Keep unsupported or missing production coverage blocked.

Do not assign a future spec ID here. The next planning pass must create the independent spec and
its task list.
