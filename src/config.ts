import {Joi} from 'celebrate';

const envVarsSchema = Joi.object()
  .keys({
    FIRESTORE_EMULATOR_HOST: Joi.string().uri(),
    FIRESTORE_PROJECT_ID: Joi.string(),
    PORT: Joi.number().integer().required(),
  })
  .unknown();

const {value: envVars, error} = envVarsSchema.validate(process.env);

if (error) {
  throw error;
}

const config = {
  firestoreEmulator: {
    host: envVars.FIRESTORE_EMULATOR_HOST,
    projectId: envVars.FIRESTORE_PROJECT_ID,
  },
  port: envVars.PORT,
};

export {config};
