import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import GiftService from '#services/gift'


@inject()
export default class GiftsController {
  constructor(
    private giftService: GiftService
  ) {}

  @inject()
  async index(ctx: HttpContext) {
    return this.giftService.all(
      Number(ctx.request.input('page', 1)),
      Number(ctx.request.input('pageSize', 1)),
    );
  }

  @inject()
  async show(ctx: HttpContext) {
    return this.giftService.find(ctx.params.id);
  }

  @inject()
  async createInvoice(ctx: HttpContext) {
    return this.giftService.createInvoice(ctx.response, ctx.auth.user!, ctx.params.id);
  }

  @inject()
  async getActivity(ctx: HttpContext) {
    return this.giftService.getActivity(
      ctx.params.id,
      Number(ctx.request.input('page', 1)),
      Number(ctx.request.input('pageSize', 1)),
    );
  }
}
