// Wraps a zod schema as Express middleware. On success, the parsed
// (trimmed/coerced) value replaces req[source] so every downstream handler
// works with clean data instead of re-checking req.body itself.
export function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const message = result.error.issues[0]?.message || "Invalid request.";
      return res.status(400).json({ error: message });
    }
    req[source] = result.data;
    next();
  };
}

// Route params (:id etc.) come in as strings; this keeps them out of raw
// SQL/lookup paths unless they actually look like the id they claim to be.
export function requireIntParam(paramName = "id") {
  return (req, res, next) => {
    const value = req.params[paramName];
    if (!/^\d+$/.test(value || "")) {
      return res.status(400).json({ error: "That doesn't look like a valid id." });
    }
    next();
  };
}
