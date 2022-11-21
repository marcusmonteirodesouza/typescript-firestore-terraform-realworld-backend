import {FieldValue, Firestore} from '@google-cloud/firestore';
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

class UsersService {
  private usersCollection = 'users';

  constructor(private firestore: Firestore) {}

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
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const document = await this.firestore
      .collection(this.usersCollection)
      .add(userData);

    const user = new User(
      document.id,
      userData.email,
      userData.username,
      undefined,
      undefined
    );

    return user;
  }

  async getUserById(userId: string): Promise<User | undefined> {
    const userDoc = await this.firestore
      .doc(`${this.usersCollection}/${userId}`)
      .get();

    const userData = userDoc.data();

    if (!userData) {
      return undefined;
    }

    const user = new User(
      userDoc.id,
      userData.email,
      userData.username,
      userData.bio,
      userData.image
    );

    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const snapshot = await this.firestore
      .collection(this.usersCollection)
      .where('email', '==', email)
      .get();

    if (snapshot.empty) {
      return undefined;
    }

    const userDoc = snapshot.docs[0];

    return await this.getUserById(userDoc.id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const snapshot = await this.firestore
      .collection(this.usersCollection)
      .where('username', '==', username)
      .get();

    if (snapshot.empty) {
      return undefined;
    }

    const userDoc = snapshot.docs[0];

    return await this.getUserById(userDoc.id);
  }

  async updateUser(userId: string, params: UpdateUserParams): Promise<User> {
    await this.firestore.runTransaction(async t => {
      const userDocRef = this.firestore.doc(
        `${this.usersCollection}/${userId}`
      );

      const userDoc = await t.get(userDocRef);

      if (!userDoc.exists) {
        throw new NotFoundError(`user "${userId}" not found`);
      }

      const userData = userDoc.data()!;

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

      t.update(userDocRef, {
        ...userData,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return (await this.getUserById(userId))!;
  }

  async verifyPassword(email: string, password: string): Promise<boolean> {
    const snapshot = await this.firestore
      .collection(this.usersCollection)
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
    const {error} = Joi.string().email().validate(email);

    if (error) {
      throw new RangeError(error.message);
    }

    if (await this.getUserByEmail(email)) {
      throw new AlreadyExistsError('"email" is taken');
    }
  }

  private async validateUsernameOrThrow(username: string) {
    if (await this.getUserByUsername(username)) {
      throw new AlreadyExistsError('"username" is taken');
    }
  }

  private async validatePasswordOrThrow(password: string) {
    if (password.length < 8) {
      throw new RangeError('"password" must contain at least 8 characters');
    }
  }

  private async validateImageOrThrow(image: string) {
    const {error} = Joi.string().uri().validate(image);

    if (error) {
      throw new RangeError(error.message);
    }
  }

  private async hashPassword(password: string) {
    return await bcrypt.hash(password, 8);
  }
}

export {UsersService};
