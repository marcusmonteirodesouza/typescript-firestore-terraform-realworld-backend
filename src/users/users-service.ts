import {Firestore} from '@google-cloud/firestore';
import * as bcrypt from 'bcryptjs';
import {User} from './user';

class UsersService {
  private usersCollection = 'users';

  constructor(private firestore: Firestore) {}

  async registerUser(
    email: string,
    username: string,
    password: string
  ): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 8);

    const document = await this.firestore.collection(this.usersCollection).add({
      email,
      username,
      passwordHash,
    });

    const user = new User(document.id, email, username, null, null);

    return user;
  }
}

export {UsersService};
