import {Joi} from 'celebrate';

const envVarsSchema = Joi.object()
  .keys({
    FIRESTORE_EMULATOR_HOST: Joi.string(),
    FIRESTORE_PROJECT_ID: Joi.string(),
    PORT: Joi.number().integer().required(),
    JWT_SECRET_KEY: Joi.string().required(),
    JWT_ISSUER: Joi.string().uri().required(),
    JWT_SECONDS_TO_EXPIRATION: Joi.number().integer().required(),
  })
  .unknown();

const {value: envVars, error} = envVarsSchema.validate(process.env);

if (error) {
  throw error;
}

const config = {
  firestore: {
    emulatorHost: envVars.FIRESTORE_EMULATOR_HOST,
    projectId: envVars.FIRESTORE_PROJECT_ID,
  },
  port: envVars.PORT,
  jwt: {
    secretKey: envVars.JWT_SECRET_KEY,
    issuer: envVars.JWT_ISSUER,
    secondsToExpiration: envVars.JWT_SECONDS_TO_EXPIRATION,
  },
};

export {config};
