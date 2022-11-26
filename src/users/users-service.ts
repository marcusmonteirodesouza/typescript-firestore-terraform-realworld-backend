import {Firestore, FirestoreDataConverter} from '@google-cloud/firestore';
import * as bcrypt from 'bcryptjs';
import {Joi} from 'celebrate';
import {AlreadyExistsError, NotFoundError} from '../errors';
import {User} from './user';

interface UpdateUserParams {
  email?: string;
  username?: string;
  password?: string;
  bio?: string;
  image?: string;
}

const userConverter: FirestoreDataConverter<User> = {
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  toFirestore: function (_user) {
    throw new Error('Function not implemented.');
  },

  fromFirestore: function (snapshot) {
    const data = snapshot.data();

    return new User(
      snapshot.id,
      data.email,
      data.username,
      data.bio,
      data.image
    );
  },
};

class UsersService {
  private readonly usersCollection = 'users';

  constructor(private readonly firestore: Firestore) {}

  async registerUser(
    email: string,
    username: string,
    password: string
  ): Promise<User> {
    await this.validateEmailOrThrow(email);

    await this.validateUsernameOrThrow(username);

    await this.validatePasswordOrThrow(password);

    const passwordHash = await this.hashPassword(password);

    const userData = {
      email,
      username,
      passwordHash,
    };

    const document = await this.firestore
      .collection(this.usersCollection)
      .add(userData);

    const user = new User(document.id, userData.email, userData.username);

    return user;
  }

  async getUserById(userId: string): Promise<User | undefined> {
    const userSnapshot = await this.firestore
      .doc(`${this.usersCollection}/${userId}`)
      .withConverter(userConverter)
      .get();

    if (!userSnapshot.exists) {
      return undefined;
    }

    return userSnapshot.data();
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const userSnapshot = await this.firestore
      .collection(this.usersCollection)
      .where('email', '==', email)
      .withConverter(userConverter)
      .get();

    if (userSnapshot.empty) {
      return undefined;
    }

    return userSnapshot.docs[0].data();
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const userSnapshot = await this.firestore
      .collection(this.usersCollection)
      .where('username', '==', username)
      .withConverter(userConverter)
      .get();

    if (userSnapshot.empty) {
      return undefined;
    }

    return userSnapshot.docs[0].data();
  }

  async updateUser(userId: string, params: UpdateUserParams): Promise<User> {
    await this.firestore.runTransaction(async t => {
      const userDocRef = this.firestore.doc(
        `${this.usersCollection}/${userId}`
      );

      const userSnapshot = await t.get(userDocRef);

      if (!userSnapshot.exists) {
        throw new NotFoundError(`user "${userId}" not found`);
      }

      const userData = userSnapshot.data()!;

      if (params.email && params.email !== userData.email) {
        await this.validateEmailOrThrow(params.email);
        userData.email = params.email;
      }

      if (params.username && params.username !== userData.username) {
        await this.validateUsernameOrThrow(params.username);
        userData.username = params.username;
      }

      if (params.password) {
        await this.validatePasswordOrThrow(params.password);
        const passwordHash = await this.hashPassword(params.password);
        userData.passwordHash = passwordHash;
      }

      if (params.bio && params.bio !== userData.bio) {
        userData.bio = params.bio;
      }

      if (params.image && params.image !== userData.image) {
        await this.validateImageOrThrow(params.image);
        userData.image = params.image;
      }

      t.update(userDocRef, userData);
    });

    return (await this.getUserById(userId))!;
  }

  async verifyPassword(email: string, password: string): Promise<boolean> {
    const snapshot = await this.firestore
      .collection(this.usersCollection)
      .select('passwordHash')
      .where('email', '==', email)
      .get();

    if (snapshot.empty) {
      throw new NotFoundError('"email" not found');
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    return await bcrypt.compare(password, userData.passwordHash);
  }

  private async validateEmailOrThrow(email: string) {
    const validatedEmail = await Joi.string().email().validateAsync(email);

    if (await this.getUserByEmail(validatedEmail)) {
      throw new AlreadyExistsError('"email" is taken');
    }
  }

  private async validateUsernameOrThrow(username: string) {
    if (await this.getUserByUsername(username)) {
      throw new AlreadyExistsError('"username" is taken');
    }
  }

  private validatePasswordOrThrow(password: string) {
    if (password.length < 8) {
      throw new RangeError('"password" must contain at least 8 characters');
    }
  }

  private async validateImageOrThrow(image: string) {
    await Joi.string().uri().validateAsync(image);
  }

  private async hashPassword(password: string) {
    return await bcrypt.hash(password, 8);
  }
}

export {UsersService};
