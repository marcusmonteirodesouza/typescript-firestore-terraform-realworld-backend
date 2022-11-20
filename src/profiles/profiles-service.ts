import {Firestore} from '@google-cloud/firestore';
import {NotFoundError} from '../errors';
import {UsersService} from '../users';
import {Profile} from './profile';

class ProfilesService {
  private followsCollection = 'follows';

  constructor(
    private firestore: Firestore,
    private usersService: UsersService
  ) {}

  async getProfile(userId: string, followerId?: string): Promise<Profile> {
    const user = await this.usersService.getUserById(userId);

    if (!user) {
      throw new NotFoundError(`user "${userId}" not found`);
    }

    let following = false;

    if (followerId) {
      following = await this.isFollowing(followerId, user.id);
    }

    return new Profile(user.username, following, user.bio, user.image);
  }

  async followUser(followerId: string, followeeId: string): Promise<void> {
    if (followerId === followeeId) {
      throw new RangeError('cannot follow ownself');
    }

    if (await this.isFollowing(followerId, followeeId)) {
      return;
    }

    const follower = await this.usersService.getUserById(followerId);

    if (!follower) {
      throw new NotFoundError(`follower "${followerId}" not found`);
    }

    const followee = await this.usersService.getUserById(followeeId);

    if (!followee) {
      throw new NotFoundError(`followee "${followeeId}" not found`);
    }

    await this.firestore.collection(this.followsCollection).add({
      followerId,
      followeeId,
    });
  }

  async unfollowUser(followerId: string, followeeId: string): Promise<void> {
    if (followerId === followeeId) {
      throw new RangeError('cannot unfollow ownself');
    }

    if (!(await this.isFollowing(followerId, followeeId))) {
      return;
    }

    const follower = await this.usersService.getUserById(followerId);

    if (!follower) {
      throw new NotFoundError(`follower "${followerId}" not found`);
    }

    const followee = await this.usersService.getUserById(followeeId);

    if (!followee) {
      throw new NotFoundError(`followee "${followeeId}" not found`);
    }

    const snapshot = await this.firestore
      .collection(this.followsCollection)
      .where('followerId', '==', followerId)
      .where('followeeId', '==', followeeId)
      .get();

    if (snapshot.empty) {
      return;
    }

    for (const doc of snapshot.docs) {
      await doc.ref.delete();
    }
  }

  async isFollowing(followerId: string, followeeId: string): Promise<boolean> {
    const snapshot = await this.firestore
      .collection(this.followsCollection)
      .where('followerId', '==', followerId)
      .where('followeeId', '==', followeeId)
      .get();

    if (snapshot.empty) {
      return false;
    }

    return true;
  }
}

export {ProfilesService};
