const fs = require("fs").promises;
const http = require("http");
const querystring = require("querystring");
const static = require("node-static");
const PORT = 3000;

const file = new static.Server(`${__dirname}/public`);

const fileData = async () => await fs.readFile(`./users.json`, "utf-8");

const fetchUserDetails = async function (pin) {
  const users = JSON.parse(await fileData());
  const user = users.find((usr) => usr.pin === pin);
  return user;
};

const validInvalidResponse = function (res, statusCode, messages, subMessage) {
  res.writeHead(statusCode, subMessage, { "Content-Type": "application/json" });
  res.write(JSON.stringify(messages));
  res.end();
};

async function updateUserBalance(unique, value, amt, modifyPin = "balance") {
  const users = JSON.parse(await fileData());
  const newData = users.map((usr) => {
    if (usr[unique] === value) {
      modifyPin === "balance" ? (usr.balance -= amt) : (usr.pin = amt);
    }
    return usr;
  });

  try {
    await fs.writeFile(`./users.json`, JSON.stringify(newData), "utf-8");
  } catch (err) {
    console.log(err);
  }
}

async function fetchJsonData(req) {
  const buffers = [];

  for await (const chunk of req) {
    buffers.push(chunk);
  }

  const data = Buffer.concat(buffers).toString();
  return data;
}

const server = http.createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/validatePin") {
    const data = JSON.parse(await fetchJsonData(req));
    const isValid = await fetchUserDetails(data.pin);

    if (!isValid)
      validInvalidResponse(res, 404, { status: "Fail", message: "Invalid pin!" }, "Not Found");
    else
      validInvalidResponse(
        res,
        200,
        { status: "success", message: "Welcome!", username: isValid.name },
        "OK"
      );
  }

  if (req.method === "POST" && req.url === "/withdrawMoney") {
    const data = JSON.parse(await fetchJsonData(req));

    const user = await fetchUserDetails(data.pin);

    if (user.balance - 500 <= data.amount)
      validInvalidResponse(
        res,
        400,
        { status: "Fail", message: "Insufficient amount!" },
        "Bad Request"
      );

    if (user["account-type"] !== data.accountType)
      validInvalidResponse(
        res,
        400,
        { status: "Fail", message: "Invalid account type!" },
        "Bad Request"
      );
    else {
      updateUserBalance("pin", data.pin, data.amount);
      validInvalidResponse(res, 200, { status: "success", message: "Done!" }, "OK");
    }
  }

  if (req.method === "POST" && req.url === "/transferAmount") {
    const data = JSON.parse(await fetchJsonData(req));
    const user = await fetchUserDetails(data.pin);

    if (user.balance - 500 <= Number(data.transferCash)) return insufficientAmt(res);

    await updateUserBalance("pin", data.pin, +data.transferCash);
    await updateUserBalance("account-no", data.accountNumber, Number(`-${data.transferCash}`));

    validInvalidResponse(
      res,
      200,
      { status: "success", message: "Money transferred successfully!" },
      "OK"
    );
  }

  if (req.method === "POST" && req.url === "/changePin") {
    const data = JSON.parse(await fetchJsonData(req));
    const user = await fetchUserDetails(data.pin);

    if (!user)
      validInvalidResponse(res, 404, { status: "Fail", message: "Incorrect pin!" }, "Not Found");
    else {
      updateUserBalance("pin", data.pin, data.newpin, "pin");
      validInvalidResponse(
        res,
        200,
        { status: "success", message: "Pin changed successfully!" },
        "OK"
      );
    }
  }

  if (req.method === "GET" && req.url.includes("/checkBalance")) {
    const reqUrl = querystring.parse(req.url);
    const user = await fetchUserDetails(+reqUrl.pin);

    validInvalidResponse(
      res,
      200,
      { status: "success", name: user.name, balance: user.balance },
      "OK"
    );
  }

  file.serve(req, res);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("listening to request!");
});
