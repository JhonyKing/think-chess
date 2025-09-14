// Configuración del servidor de correos
export const EMAIL_CONFIG = {
  host: "smtp.ionos.mx",
  port: 587,
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: "Direcciongeneral@piensajedrez.com",
    pass: "14100090.Ionos",
  },
  tls: {
    rejectUnauthorized: false, // Para desarrollo
  },
};

export const SERVER_CONFIG = {
  port: process.env.PORT || 3001,
  fromName: "Academia Piensa Ajedrez",
  fromAddress: "Direcciongeneral@piensajedrez.com",
};








