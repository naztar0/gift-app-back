import * as mongoose from 'mongoose';
import { errors, symbols } from '@adonisjs/auth';
import { AuthClientResponse, GuardContract } from '@adonisjs/auth/types';
import type { HttpContext } from '@adonisjs/core/http';
import { updateUserPhoto, validateTelegramData } from '#utils/telegram';

/**
 * The bridge between the User provider and the
 * Guard
 */
export type TelegramGuardUser<RealUser> = {
  /**
   * Returns the unique ID of the user
   */
  getId(): mongoose.Types.ObjectId;

  /**
   * Returns the original user object
   */
  getOriginal(): RealUser;

  photoUrl?: string;
};

/**
 * The interface for the UserProvider accepted by the
 * Telegram guard
 */
export interface TelegramUserProviderContract<RealUser> {
  /**
   * A property the guard implementation can use to infer
   * the data type of the actual user (aka RealUser)
   */
  [symbols.PROVIDER_REAL_USER]?: RealUser;

  findById(identifier: string | number | BigInt): Promise<TelegramGuardUser<RealUser> | null>;

  /**
   * Find a user by the telegram ID
   */
  findByTelegramId(telegramId: number): Promise<TelegramGuardUser<RealUser> | null>;

  /**
   * Creates a new user
   */
  createUser(user: WebAppUser): Promise<TelegramGuardUser<RealUser>>;

  /**
   * Create a user object that acts as an adapter between
   * the guard and real user value.
   */
  createUserForGuard(user: RealUser): Promise<TelegramGuardUser<RealUser>>;
}

export type TelegramGuardOptions = {
  token: string;
}

export class TelegramGuard<UserProvider extends TelegramUserProviderContract<unknown>>
  implements GuardContract<UserProvider[typeof symbols.PROVIDER_REAL_USER]>
{
  constructor(
    private readonly ctx: HttpContext,
    private readonly userProvider: UserProvider,
    private readonly options: TelegramGuardOptions,
  ) {}

  /**
   * A list of events and their types emitted by
   * the guard.
   */
  declare [symbols.GUARD_KNOWN_EVENTS]: {};

  /**
   * A unique name for the guard driver
   */
  driverName: 'telegram' = 'telegram';

  /**
   * A flag to know if the authentication was an attempt
   * during the current HTTP request
   */
  authenticationAttempted: boolean = false;

  /**
   * A boolean to know if the current request has
   * been authenticated
   */
  isAuthenticated: boolean = false;

  /**
   * Reference to the currently authenticated user
   */
  user?: UserProvider[typeof symbols.PROVIDER_REAL_USER];

  /**
   * Authenticate the current HTTP request and return
   * the user instance if there is a valid telegram initData
   * or throw an exception
   */
  async authenticate(): Promise<UserProvider[typeof symbols.PROVIDER_REAL_USER]> {
    /**
     * Avoid re-authentication when it has been done already
     * for the given request
     */
    if (this.authenticationAttempted) {
      return this.getUserOrFail();
    }
    this.authenticationAttempted = true;

    /**
     * Ensure the auth header exists
     */
    const authHeader = this.ctx.request.header('authorization')
    if (!authHeader) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
        guardDriverName: this.driverName,
      })
    }

    /**
     * Split the header value and read the initDataRaw from it
     */
    const [, initDataRaw] = authHeader.split('Telegram ')
    if (!initDataRaw) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
        guardDriverName: this.driverName,
      })
    }

    /**
     * Verify the initData and extract the initData object
     */
    const [verified, initData] = validateTelegramData(initDataRaw, this.options.token);

    if (!verified || !initData.user) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
        guardDriverName: this.driverName,
      })
    }

    /**
     * Fetch the user by user ID and save a reference to it
     */
    let providerUser = await this.userProvider.findByTelegramId(initData.user.id);
    if (!providerUser) {
      providerUser = await this.userProvider.createUser(initData.user);
      updateUserPhoto(initData.user.id).catch();
    }

    this.user = providerUser.getOriginal();
    return this.getUserOrFail();
  }

  /**
   * Same as authenticate, but does not throw an exception
   */
  async check(): Promise<boolean> {
    try {
      await this.authenticate();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns the authenticated user or throws an error
   */
  getUserOrFail(): UserProvider[typeof symbols.PROVIDER_REAL_USER] {
    if (!this.user) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
        guardDriverName: this.driverName,
      })
    }

    return this.user;
  }

  /**
   * This method is called by Japa during testing when "loginAs"
   * method is used to login the user.
   */
  async authenticateAsClient(
    _user: UserProvider[typeof symbols.PROVIDER_REAL_USER]
  ): Promise<AuthClientResponse> {
    return {
      headers: {
        authorization: '',
      },
    }
  }
}
