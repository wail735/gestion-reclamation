const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const path = require('path');

const sendEmail = async (options) => {
    // Si les variables d'environnement ne sont pas définies, on affiche l'email dans la console pour le dev
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
        console.log('--- EMAIL SIMULÉ (Variables non définies) ---');
        console.log(`À: ${options.email}`);
        console.log(`Sujet: ${options.subject}`);
        console.log(`Message: \n${options.message}`);
        console.log('---------------------------------------------');
        return;
    }

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const handlebarOptions = {
        viewEngine: {
            extName: '.hbs',
            partialsDir: path.resolve(__dirname, '../templates'),
            defaultLayout: false,
        },
        viewPath: path.resolve(__dirname, '../templates'),
        extName: '.hbs',
    };

    transporter.use('compile', hbs(handlebarOptions));

    const mailOptions = {
        from: `Wakalati SEAAL <${process.env.EMAIL_FROM || 'noreply@seaal.dz'}>`,
        to: options.email,
        subject: options.subject,
    };

    if (options.template) {
        mailOptions.template = options.template;
        mailOptions.context = options.context;
    } else {
        mailOptions.text = options.message; // Fallback text brut
    }

    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
