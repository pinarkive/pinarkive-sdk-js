const assert = require("node:assert/strict");
const { createServer } = require("node:http");
const { after, before, describe, it } = require("node:test");
const PinarkiveClient = require("./index.js");
const { PinarkiveAPIError } = PinarkiveClient;

describe("PinarkiveClient (js)", () => {
  let baseUrl = "";
  let lastAuth = "";
  let lastPath = "";
  let statusToReturn = 200;
  let bodyToReturn = '{"ok":true}';

  const server = createServer((req, res) => {
    lastAuth = String(req.headers.authorization || req.headers["x-api-key"] || "");
    lastPath = req.url || "";
    res.writeHead(statusToReturn, { "Content-Type": "application/json" });
    res.end(bodyToReturn);
  });

  before(async () => {
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const addr = server.address();
    baseUrl = `http://127.0.0.1:${addr.port}`;
  });

  after(async () => {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  });

  it("sends bearer auth and parses JSON", async () => {
    statusToReturn = 200;
    bodyToReturn = '{"cid":"bafy","status":"ok"}';
    const client = new PinarkiveClient({ token: "abc", baseUrl });
    const me = await client.getMe();
    assert.equal(lastAuth, "Bearer abc");
    assert.equal(lastPath, "/users/me");
    assert.deepEqual(me, { cid: "bafy", status: "ok" });
  });

  it("throws PinarkiveAPIError on 4xx", async () => {
    statusToReturn = 401;
    bodyToReturn = '{"error":"Unauthorized","message":"bad","code":"unauthorized"}';
    const client = new PinarkiveClient({ token: "x", baseUrl });
    await assert.rejects(
      () => client.getMe(),
      (err) => {
        assert.ok(err instanceof PinarkiveAPIError);
        assert.equal(err.statusCode, 401);
        assert.equal(err.code, "unauthorized");
        return true;
      }
    );
  });

  it("requires baseUrl", () => {
    assert.throws(() => new PinarkiveClient({ token: "x" }), /baseUrl is required/);
  });
});
