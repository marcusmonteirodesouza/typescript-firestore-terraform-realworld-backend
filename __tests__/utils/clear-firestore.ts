import axios from 'axios';
import {config} from '../../src/config';

async function clearFirestore() {
  const url = `http://${config.firestore.emulatorHost}/emulator/v1/projects/${config.firestore.projectId}/databases/(default)/documents`;

  await axios.delete(url);
}

export {clearFirestore};
