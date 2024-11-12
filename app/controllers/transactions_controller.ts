import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import TransactionService from '#services/transaction'


@inject()
export default class TransactionsController {
  constructor(
    private transactionService: TransactionService
  ) {}

  // User's bought gifts
  @inject()
  async index(ctx: HttpContext) {
    return this.transactionService.userTransactions(
      ctx.auth.user!._id,
      Number(ctx.request.input('page', 1)),
      Number(ctx.request.input('pageSize', 1)),
    );
  }

  @inject()
  async show(ctx: HttpContext) {
    return this.transactionService.find(ctx.response, ctx.params.id);
  }

  @inject()
  async acceptPayment(ctx: HttpContext) {
    return this.transactionService.acceptPayment(ctx.request.body(), ctx.request.headers());
  }

  // Transfer a gift to the current user when the user has received it
  @inject()
  async createTransfer(ctx: HttpContext) {
    return this.transactionService.createTransfer(
      ctx.response,
      ctx.params.id,
      ctx.auth.user!,
    );
  }
}
