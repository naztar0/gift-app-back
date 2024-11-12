import * as mongoose from 'mongoose';
import { symbols } from '@adonisjs/auth';
import { RuntimeException as RuntimeException3 } from '@adonisjs/core/exceptions';


export class TelegramUserProvider<UserModel extends mongoose.Model<any>> {
  /**
   * Reference to the lazily imported model
   */
  protected model?: UserModel;

  [symbols.PROVIDER_REAL_USER]?: InstanceType<UserModel>;

  constructor(
    private readonly options: {
      model: () => Promise<{ default: UserModel }>;
    }
  ) {}

  /**
   * Imports the model from the provider, returns and caches it
   * for further operations.
   */
  async getModel() {
    if (this.model && !('hot' in import.meta)) {
      return this.model;
    }
    const importedModel = await this.options.model();
    this.model = importedModel.default;
    return this.model;
  }

  /**
   * Creates an adapter user for the guard
   */
  async createUserForGuard(user: mongoose.Document<any>) {
    const model = await this.getModel();
    if (!(user instanceof model)) {
      throw new RuntimeException3(
        `Invalid user object. It must be an instance of the "${model.name}" model`
      );
    }

    return {
      getId(): mongoose.Types.ObjectId {
        if (!user._id) {
          throw new RuntimeException3(
            `Cannot use "${model.name}" model for authentication. The value of column '_id' is undefined or null`
          );
        }
        return user._id;
      },
      getOriginal() {
        return user;
      }
    };
  }

  /**
   * Finds a user by the user id
   */
  async findById(identifier: string) {
    const model = await this.getModel();
    const user = await model.findById(identifier).exec();
    if (!user) {
      return null;
    }
    return this.createUserForGuard(user);
  }

  /**
    * Finds a user by the telegram id
    */
  async findByTelegramId(telegramId: number) {
    const model = await this.getModel();
    const user = await model.findOne({ telegramId }).exec();
    if (!user) {
      return null;
    }
    return this.createUserForGuard(user);
  }

  /**
   * Creates a new user
   */
  async createUser(user: WebAppUser) {
    const model = await this.getModel();
    return new model({
      telegramId: user.id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name || '',
      languageCode: user.language_code,
      isPremium: user.is_premium || false,
    }).save();
  }
}

export function telegramUserProvider<Model extends mongoose.Model<any>>(options: { model: () => Promise<{ default: Model }> }) {
  return new TelegramUserProvider(options);
}
