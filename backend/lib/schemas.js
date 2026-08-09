import { z } from "zod";

// Every schema returns a user-facing message on the first failure, matching
// the tone of the hand-written checks these replace. Trimming/lower-casing
// email here means every route sees a normalized value instead of each
// handler doing its own cleanup.

const email = z
  .string({ required_error: "Please enter your email." })
  .trim()
  .toLowerCase()
  .min(1, "Please enter your email.")
  .max(320, "That email address is too long.")
  .email("Please enter a valid email address.");

const password = (label = "Password") =>
  z
    .string({ required_error: `${label} is required.` })
    .min(8, `${label} must be at least 8 characters.`)
    .max(200, `${label} is too long.`);

export const signupSchema = z
  .object({
    role: z.enum(["donor", "ngo"], {
      errorMap: () => ({ message: "Role must be either donor or ngo." }),
    }),
    name: z
      .string({ required_error: "Please enter your name." })
      .trim()
      .min(1, "Please enter your name.")
      .max(200, "That name is too long."),
    org: z.string().trim().max(200, "That organisation name is too long.").optional().nullable(),
    email,
    password: password(),
    city: z
      .string({ required_error: "Please enter your city." })
      .trim()
      .min(1, "Please enter your city.")
      .max(200, "That city name is too long."),
  })
  .refine((data) => data.role !== "ngo" || !!(data.org && data.org.trim()), {
    message: "Please include your organisation's name.",
    path: ["org"],
  });

export const loginSchema = z.object({
  email,
  password: z.string({ required_error: "Please enter your password." }).min(1, "Please enter your password."),
});

export const emailOnlySchema = z.object({ email });

export const verifyEmailSchema = z.object({
  token: z.string({ required_error: "Missing verification token." }).min(1, "Missing verification token."),
});

export const resetPasswordSchema = z.object({
  token: z.string({ required_error: "Missing reset token." }).min(1, "Missing token."),
  password: password("New password"),
});

const DONATION_CATEGORIES = ["food", "clothing", "supplies", "other"];
const MAX_EXPIRY_MS = 1000 * 60 * 60 * 24 * 30; // 30 days out, generous ceiling for perishables

const latitude = z.coerce.number().min(-90).max(90).optional().nullable();
const longitude = z.coerce.number().min(-180).max(180).optional().nullable();

export const createDonationSchema = z
  .object({
    title: z
      .string({ required_error: "Please fill in the required fields." })
      .trim()
      .min(1, "Please fill in the required fields.")
      .max(200, "That title is too long."),
    category: z.enum(DONATION_CATEGORIES, {
      errorMap: () => ({ message: "Please choose a valid category." }),
    }),
    quantity: z.string().trim().max(200, "That quantity is too long.").optional().nullable(),
    description: z.string().trim().max(2000, "That description is too long.").optional().nullable(),
    place: z
      .string({ required_error: "Please fill in the required fields." })
      .trim()
      .min(1, "Please fill in the required fields.")
      .max(200, "That location is too long."),
    expiresInMs: z
      .number()
      .int()
      .positive("Expiry must be a positive duration.")
      .max(MAX_EXPIRY_MS, "Expiry can't be more than 30 days out.")
      .optional()
      .nullable(),
    latitude,
    longitude,
  })
  .refine((data) => (data.latitude == null) === (data.longitude == null), {
    message: "Location needs both a latitude and a longitude.",
    path: ["longitude"],
  });

// ---------------------------------------------------------------------------
// NGO profile / verification (TODO sections 6-7, 9)
// ---------------------------------------------------------------------------

const isoDateOrNull = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD for dates.")
  .optional()
  .nullable();

export const ngoProfileSchema = z.object({
  registrationNumber: z.string().trim().max(100).optional().nullable(),
  form12abNumber: z.string().trim().max(100).optional().nullable(),
  form12abValidUntil: isoDateOrNull,
  form80gNumber: z.string().trim().max(100).optional().nullable(),
  form80gValidUntil: isoDateOrNull,
});

export const ngoVerifyDecisionSchema = z.object({
  status: z.enum(["verified", "rejected", "under_review"], {
    errorMap: () => ({ message: "Status must be verified, rejected, or under_review." }),
  }),
  notes: z.string().trim().max(2000).optional().nullable(),
});

// documents uploaded against an NGO profile (registration/12AB/80G proof)
export const ngoDocumentTypeSchema = z.object({
  type: z.enum(["ngo_verification", "form_12ab", "form_80g", "other"], {
    errorMap: () => ({ message: "Not a valid NGO document type." }),
  }),
});

// documents uploaded against a specific donation (receipts, acknowledgements, etc.)
export const donationDocumentTypeSchema = z.object({
  type: z.enum(
    [
      "donation_receipt",
      "payment_record",
      "ngo_acknowledgement",
      "delivery_proof",
      "impact_proof",
      "tax_document",
      "csr_evidence",
      "other",
    ],
    { errorMap: () => ({ message: "Not a valid document type for a donation." }) }
  ),
});

export const documentReviewSchema = z.object({
  status: z.enum(["approved", "rejected"], {
    errorMap: () => ({ message: "Status must be approved or rejected." }),
  }),
  notes: z.string().trim().max(2000).optional().nullable(),
});

// ---------------------------------------------------------------------------
// Impact records (TODO section 12)
// ---------------------------------------------------------------------------

export const impactRecordSchema = z.object({
  beneficiaryCount: z.coerce.number().int().nonnegative().max(1_000_000).optional().nullable(),
  location: z.string().trim().max(200).optional().nullable(),
  itemsDelivered: z.string().trim().max(500).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const listDonationsQuerySchema = z.object({
  category: z.enum([...DONATION_CATEGORIES, "all"]).optional(),
  status: z
    .enum([
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
    ])
    .optional(),
  // Viewer's own coordinates (browser geolocation — see Browse.jsx's "Near
  // me" toggle). Present together, GET /donations sorts by distance and
  // every listing that itself has a latitude/longitude gets a distanceKm
  // in the response; listings without coordinates just sort to the end.
  lat: latitude,
  lng: longitude,
});

// ---------------------------------------------------------------------------
// Settings (profile + password)
// ---------------------------------------------------------------------------

export const updateProfileSchema = z.object({
  name: z
    .string({ required_error: "Please enter your name." })
    .trim()
    .min(1, "Please enter your name.")
    .max(200, "That name is too long."),
  org: z.string().trim().max(200, "That organisation name is too long.").optional().nullable(),
  city: z
    .string({ required_error: "Please enter your city." })
    .trim()
    .min(1, "Please enter your city.")
    .max(200, "That city name is too long."),
});

// ---------------------------------------------------------------------------
// Admin: user management + site settings
// ---------------------------------------------------------------------------

export const updateUserRoleSchema = z.object({
  role: z.enum(["donor", "manager"], {
    errorMap: () => ({ message: "Role must be donor or manager." }),
  }),
});

export const siteSettingsSchema = z
  .object({
    siteName: z.string().trim().min(1, "Site name can't be empty.").max(120, "That name is too long.").optional(),
    supportEmail: email.optional().nullable(),
    announcementBanner: z.string().trim().max(500, "Keep the banner under 500 characters.").optional().nullable(),
    maintenanceMode: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "Nothing to update." });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string({ required_error: "Please enter your current password." }).min(1, "Please enter your current password."),
    newPassword: password("New password"),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Your new password needs to be different from your current one.",
    path: ["newPassword"],
  });

// ---------------------------------------------------------------------------
// NGO team members
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Public contact form
// ---------------------------------------------------------------------------

export const contactMessageSchema = z.object({
  name: z
    .string({ required_error: "Please enter your name." })
    .trim()
    .min(1, "Please enter your name.")
    .max(200, "That name is too long."),
  email,
  reason: z
    .string()
    .trim()
    .max(120, "That reason is too long.")
    .optional()
    .default("General question"),
  message: z
    .string({ required_error: "Please enter a message." })
    .trim()
    .min(1, "Please enter a message.")
    .max(5000, "That message is too long."),
});

export const addTeamMemberSchema = z.object({
  name: z
    .string({ required_error: "Please enter their name." })
    .trim()
    .min(1, "Please enter their name.")
    .max(200, "That name is too long."),
  email,
  role: z.enum(["admin", "member"], {
    errorMap: () => ({ message: "Role must be either admin or member." }),
  }).optional().default("member"),
});
