class LeadServiceError(Exception):
    """Base class for domain-level lead errors routers map to HTTP responses."""


class LeadNotFound(LeadServiceError):
    """Raised when a lead cannot be found by id."""


class IllegalStateTransition(LeadServiceError):
    """Raised when an unsupported lead state transition is requested."""


class InvalidResume(LeadServiceError):
    """Raised when an uploaded resume fails validation (type or size)."""
