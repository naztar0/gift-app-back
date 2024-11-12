import * as daemons from '#services/daemons';


setInterval(daemons.checkInvoices, 2e4);
setInterval(daemons.invalidateExpiredTransactions, 1e4);
setInterval(daemons.updateLeaderboard, 6e4);
