import { proxyYahooRequest } from "./_lib/yahooProxy.js";

export default async function handler(req, res) {
  return proxyYahooRequest(req, res, "https://query1.finance.yahoo.com");
}
