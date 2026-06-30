const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message;
    let errors = [];

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        statusCode = 404;
        message = 'Ressource introuvable';
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        statusCode = 400;
        message = 'Valeur dupliquée entrée';
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Erreur de validation des données';
        errors = Object.values(err.errors).map(val => val.message);
    }

    // Zod validation error
    if (err.name === 'ZodError') {
        statusCode = 400;
        message = 'Erreur de validation des données';
        errors = (err.issues || err.errors).map(e => ({ field: e.path.join('.'), message: e.message }));
    }

    res.status(statusCode).json({
        success: false,
        error: message,
        message: message, // For frontend compatibility
        details: errors.length > 0 ? errors : undefined,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

const notFound = (req, res, next) => {
    const error = new Error(`Non trouvé - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

module.exports = { errorHandler, notFound };
