import {Firestore} from '@google-cloud/firestore';
import * as bcrypt from 'bcryptjs';
import {Joi} from 'celebrate';
import {AlreadyExistsError, NotFoundError} from '../errors';
import {User} from './user';

interface UpdateUserData {
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

    const document = await this.firestore.collection(this.usersCollection).add({
      email,
      username,
      passwordHash,
    });

    const user = new User(document.id, email, username, undefined, undefined);

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
    const userData = userDoc.data();

    const user = new User(
      userDoc.id,
      userData.email,
      userData.username,
      userData.bio,
      userData.image
    );

    return user;
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
    const userData = userDoc.data();

    const user = new User(
      userDoc.id,
      userData.email,
      userData.username,
      userData.bio,
      userData.image
    );

    return user;
  }

  async updateUser(userId: string, data: UpdateUserData): Promise<User> {
    const userDocRef = this.firestore.doc(`${this.usersCollection}/${userId}`);

    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      throw new NotFoundError(`user "${userId}" not found`);
    }

    const userData = userDoc.data()!;

    if (data.email && data.email !== userData.email) {
      await this.validateEmailOrThrow(data.email);
      userData.email = data.email;
    }

    if (data.username && data.username !== userData.username) {
      await this.validateUsernameOrThrow(data.username);
      userData.username = data.username;
    }

    if (data.password) {
      await this.validatePasswordOrThrow(data.password);
      const passwordHash = await this.hashPassword(data.password);
      userData.passwordHash = passwordHash;
    }

    if (data.bio && data.bio !== userData.bio) {
      userData.bio = data.bio;
    }

    if (data.image && data.image !== userData.image) {
      await this.validateImageOrThrow(data.image);
      userData.image = data.image;
    }

    await userDocRef.update(userData);

    return new User(
      userDoc.id,
      userData.email,
      userData.username,
      userData.bio,
      userData.image
    );
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
