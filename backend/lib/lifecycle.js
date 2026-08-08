import pool from "../db/index.js";

// The full ten-stage flow (TODO section 8). `matched` is reserved for the
// automated location-matching feature described in the README as not yet
// built — until that exists, the flow goes straight from `listed` to
// `claimed`, same as it does today. The edge is kept here so wiring up
// matching later is a one-line addition, not a rewrite of this file.
export const STAGES = [
  "listed",
  "matched",
  "claimed",
  "accepted",
  "pickup",
  "delivered",
  "acknowledged",
  "impact_recorded",
  "documentation_complete",
  "closed",
];

const TIMESTAMP_COLUMN = {
  listed: "listed_at",
  matched: "matched_at",
  claimed: "claimed_at",
  accepted: "accepted_at",
  pickup: "pickup_at",
  delivered: "delivered_at",
  acknowledged: "acknowledged_at",
  impact_recorded: "impact_recorded_at",
  documentation_complete: "documentation_complete_at",
  closed: "closed_at",
};

// Directed edges: which stage(s) a donation may move to from a given stage.
// A donation can reach `impact_recorded` from either `delivered` or
// `acknowledged` because logging impact (routes/impact.js) is allowed as
// soon as something is delivered — the donor acknowledging receipt doesn't
// have to happen first.
const TRANSITIONS = {
  listed: ["claimed"],
  matched: ["claimed"],
  claimed: ["accepted"],
  accepted: ["pickup"],
  pickup: ["delivered"],
  delivered: ["acknowledged", "impact_recorded"],
  acknowledged: ["impact_recorded"],
  impact_recorded: ["documentation_complete"],
  documentation_complete: ["closed"],
  closed: [],
};

export function canTransition(from, to) {
  return (TRANSITIONS[from] || []).includes(to);
}

export function nextStages(from) {
  return TRANSITIONS[from] || [];
}

class LifecycleError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/**
 * Moves a donation to `toStatus`. Locks the row, checks the edge is legal,
 * stamps that stage's timestamp column, and writes one audit_logs row — all
 * inside a single transaction, so a donation's status and its audit trail
 * can never drift apart even under concurrent requests.
 *
 * Throws LifecycleError (with a `.status` for the route to forward) if the
 * donation doesn't exist or the transition isn't a legal edge.
 */
export async function advanceDonation({ donationId, toStatus, userId, action, metadata = {}, setColumns = {} }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existing = await client.query("SELECT * FROM donations WHERE id = $1 FOR UPDATE", [donationId]);
    const donation = existing.rows[0];
    if (!donation) {
      throw new LifecycleError("That listing could not be found.", 404);
    }
    if (!canTransition(donation.status, toStatus)) {
      throw new LifecycleError(
        `This listing is '${donation.status}' and can't move to '${toStatus}' from there.`,
        409
      );
    }

    // Lets a caller (e.g. /:id/claim setting claimed_by) update another
    // column in the same UPDATE/transaction as the status change, instead
    // of a separate query that would run outside the row lock.
    const extraCols = Object.keys(setColumns);
    const setClauses = [`status = $1`, `${TIMESTAMP_COLUMN[toStatus]} = now()`];
    const values = [toStatus];
    extraCols.forEach((col) => {
      values.push(setColumns[col]);
      setClauses.push(`${col} = $${values.length}`);
    });
    values.push(donationId);

    const updated = await client.query(
      `UPDATE donations SET ${setClauses.join(", ")} WHERE id = $${values.length} RETURNING *`,
      values
    );

    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, 'donation', $3, $4::jsonb)`,
      [
        userId ?? null,
        action || `donation_${toStatus}`,
        donationId,
        JSON.stringify({ from: donation.status, to: toStatus, ...metadata }),
      ]
    );

    await client.query("COMMIT");
    return updated.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// Every status change plus anything else logged against this donation
// (impact, document review) so the UI can render one combined timeline.
export async function getDonationHistory(donationId) {
  const result = await pool.query(
    `SELECT al.id, al.action, al.metadata, al.user_id, al.created_at, u.name AS user_name, u.role AS user_role
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.user_id
     WHERE al.entity_type = 'donation' AND al.entity_id = $1
     ORDER BY al.created_at ASC`,
    [donationId]
  );
  return result.rows.map((row) => ({
    id: row.id,
    action: row.action,
    fromStatus: row.metadata?.from ?? null,
    toStatus: row.metadata?.to ?? null,
    metadata: row.metadata,
    userId: row.user_id,
    userName: row.user_name,
    userRole: row.user_role,
    createdAt: row.created_at,
  }));
}

export { LifecycleError };
