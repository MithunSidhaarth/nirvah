/**
 * Sends transactional email via Resend (https://resend.com) when
 * RESEND_API_KEY and EMAIL_FROM are set. Until you've created a Resend
 * account, verified the Nirvah domain, and added those two env vars, every
 * "sent" email is instead printed to the server console — so verification
 * and reset links stay usable for local development either way.
 *
 * Every route in this app calls sendEmail(...) the same way regardless of
 * which path runs, so nothing else needs to change once Resend is wired up.
 */
export async function sendEmail({ to, subject, text, html, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.log("\n---- EMAIL (dev stub — set RESEND_API_KEY + EMAIL_FROM to send for real) ----");
    console.log("To:     ", to);
    if (replyTo) console.log("Reply-To:", replyTo);
    console.log("Subject:", subject);
    console.log(text);
    console.log("---- END EMAIL ----\n");
    return { delivered: false, reason: "no_api_key" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text,
      html: html || undefined,
      reply_to: replyTo || undefined,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    // Don't throw: a failed email shouldn't break signup/reset requests that
    // otherwise succeeded. Log loudly so it's visible in server logs/monitoring.
    console.error(`Resend request failed (${res.status}) sending to ${to}:`, body);
    return { delivered: false, reason: "resend_error", status: res.status };
  }

  const data = await res.json();
  return { delivered: true, id: data.id };
}
