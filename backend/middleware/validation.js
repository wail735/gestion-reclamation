const { z } = require('zod');

// Middleware to validate request body using a Zod schema
const validate = (schema) => (req, res, next) => {
    try {
        req.body = schema.parse(req.body);
        next();
    } catch (error) {
        next(error); // Passes to error handler which handles ZodError
    }
};

// --- Schemas ---

const registerSchema = z.object({
    nom: z.string().min(2, "Le nom doit comporter au moins 2 caractères"),
    prenom: z.string().min(2, "Le prénom doit comporter au moins 2 caractères"),
    email: z.string().email("Format d'e-mail invalide"),
    motDePasse: z.string().min(6, "Le mot de passe doit comporter au moins 6 caractères"),
    confirmMotDePasse: z.string().min(6),
    adresse: z.string().optional(),
    phone: z.string().optional(),
}).refine((data) => data.motDePasse === data.confirmMotDePasse, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmMotDePasse"],
});

const loginSchema = z.object({
    email: z.string().email("Format d'e-mail invalide"),
    motDePasse: z.string().min(1, "Mot de passe requis"),
});

const complaintSchema = z.object({
    description: z.string().min(10, "La description doit comporter au moins 10 caractères"),
    adresse: z.string().optional(),
    type: z.string().optional(),
});

module.exports = {
    validate,
    registerSchema,
    loginSchema,
    complaintSchema
};
