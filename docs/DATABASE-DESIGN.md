# Database Design

SafarRent adds `Maintenance`, `VehicleDocument`, and `BookingIntakeAudit` collections with timestamps, validation, ownership references, and indexes for status, vehicle, supplier, expiry, and audit history. Existing `Booking` and `Car` collections remain authoritative for booking and fleet state.
