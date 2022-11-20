import {Firestore} from '@google-cloud/firestore';
import {NotFoundError} from '../errors';
import {UsersService} from '../users';

class ProfilesService {
  private followsCollection = 'follows';

  constructor(
    private firestore: Firestore,
    private usersService: UsersService
  ) {}

  async followUser(followerId: string, followeeId: string): Promise<void> {
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
