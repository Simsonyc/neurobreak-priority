import { z } from "zod";

export const createSessionSchema = z.object({
  first_name: z.string().min(1, "first_name is required"),
  email: z.string().email("Invalid email"),
  profil_selected: z.enum([
    "entrepreneur",
    "salarie",
    "independant",
    "createur",
  ]),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;