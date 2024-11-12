import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import UserService from '#services/user'


@inject()
export default class UsersController {
  constructor(
    private userService: UserService,
  ) {}

  @inject()
  async show(ctx: HttpContext) {
    return this.userService.find(ctx.response, ctx.params.id);
  }

  @inject()
  async getMe(ctx: HttpContext) {
    return this.userService.find(ctx.response, ctx.auth.user!._id);
  }

  @inject()
  async updateMe(ctx: HttpContext) {
    return this.userService.update(ctx);
  }

  @inject()
  async getActivity(ctx: HttpContext) {
    return this.userService.activityHistory(
      ctx.auth.user!._id,
      Number(ctx.request.input('page', 1)),
      Number(ctx.request.input('pageSize', 1)),
    );
  }

  // User's accepted gifts
  @inject()
  async getGifts(ctx: HttpContext) {
    return this.userService.profileGifts(
      ctx.response,
      ctx.params.id,
      Number(ctx.request.input('page', 1)),
      Number(ctx.request.input('pageSize', 1)),
    );
  }

  async getLeaderboard(ctx: HttpContext) {
    return this.userService.getLeaderboard(
      Number(ctx.request.input('page', 1)),
      Number(ctx.request.input('pageSize', 1)),
      ctx.request.input('search', ''),
    );
  }
}
