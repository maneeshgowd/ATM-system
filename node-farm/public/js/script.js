"use strict";

(function ATMInterface() {
  const main = document.querySelector(".main");
  const firstOptions = document.querySelector(".options-page");
  const enterPin = document.getElementById("enter-pin");
  const error = document.querySelector(".error");
  const withdraw = document.querySelector(".withdraw");
  const withdrawMoney = document.getElementById("withdraw-money");
  const sendMoney = document.getElementById("send-money");
  const username = document.getElementById("username");
  const transfer = document.querySelector(".transfer");
  const changePin = document.querySelector(".change-pin");
  const balance = document.querySelector(".balance");
  const accountNo = document.getElementById("account-no");
  const oldPin = document.querySelector(".old-pin");
  const newPin = document.querySelector(".new-pin");

  const submitPin = document.getElementById("submit-pin");
  const options = document.querySelector(".options");
  const exit = document.querySelectorAll("#exit");
  const drawMoney = document.getElementById("draw-money");
  const withdrawOptions = document.querySelector(".withdraw-options");
  const transferMoney = document.getElementById("transfer-money");
  const changeOldPin = document.getElementById("changeUserPin");

  let choosen = null;
  const TIME = 3;
  const limit = Object.freeze({
    savings: 10000,
    current: 25000,
  });

  const addExitHandler = () => location.reload();

  submitPin.addEventListener("click", addSubmitPin);
  options.addEventListener("click", addOptionsHandler);
  [...exit].forEach((ext) => ext.addEventListener("click", addExitHandler));
  withdrawOptions.addEventListener("click", withdrawHandler);
  drawMoney?.addEventListener("click", addDrawMoneyHandler);
  transferMoney.addEventListener("click", addTransferMoneyHandler);
  changeOldPin.addEventListener("click", changeUserPin);

  async function FACTORY(url, data) {
    try {
      const request = await fetch(`/${url}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "cors",
        body: JSON.stringify(data),
      });

      const response = await request.json();
     
      if (response.status !== "success") throw new Error(response.message);
      errorHandler(response.message);
      return response;
    } catch (err) {
      errorHandler(err.message);
      reload();
    }
  }

  async function addSubmitPin() {
    const pin = enterPin.value.trim();
    if (pin.length < 4) return;
    const data = await FACTORY("validatePin", { pin: +pin });
    // welcome new user
    username.textContent = `Welcome ${data.username} 😊`;
    toggleClasses(main, firstOptions);
  }

  async function addTransferMoneyHandler() {
    const accountNumber = accountNo.value.trim();
    const transferCash = sendMoney.value;
    FACTORY("transferAmount", { accountNumber, transferCash, pin: +enterPin.value });
    reload();
  }

  async function changeUserPin() {
    const oldpin = oldPin.value.trim();
    const newpin = newPin.value.trim();

    FACTORY("changePin", { pin: +oldpin, newpin: +newpin });
    reload();
  }

  async function addDrawMoneyHandler() {
    const validamt = withdrawMoney.value % 2 === 0;

    if (!validamt) return errorHandler("Invalid amount!");

    if (choosen === "savings" && withdrawMoney.value > limit.savings) {
      return errorHandler("Invalid amount!");
    }

    if (choosen === "current" && withdrawMoney.value > limit.current && validamt)
      return errorHandler("Invalid amount!");

    FACTORY("withdrawMoney", {
      amount: withdrawMoney.value,
      pin: +enterPin.value,
      accountType: choosen,
    });

    successHtml(withdrawMoney.value);

    reload(6);
  }

  async function checkUserBalance() {
    try {
      const request = await fetch(`/checkBalance&pin=${+enterPin.value}`);
      const response = await request.json();
      if (response.status !== "success") throw new Error(response.message);
      updateUserBalance(response);
      reload();
    } catch (err) {
      errorHandler(err.message);
      reload();
    }
  }

  function successHtml(amt) {
    const html = `
      <div class="success-money div">
      <h2 class="sub-title">Please wait...</h2>
      <h1 class="title transact hidden">Transaction is being processed...</h1>
      <h1 class="title amt transact hidden">Amount drawn ₹${amt}</h1>
    </div>`;

    withdraw.innerHTML = "";
    withdraw.insertAdjacentHTML("beforeend", html);
    [...withdraw.querySelectorAll(".transact")].forEach((ele) => ele.classList.remove("hidden"));
  }

  function updateUserBalance(data) {
    const html = `    
      <h1 class="title">Balance ₹</h1>
      <p class="para">Hello ${data.name} Your balance is..</p>
      <div class="available-balance div">
        <h2 class="sub-title">Available Balance: <span>₹${data.balance - 500}.00</span></h2>
        <h2 class="sub-title">Ledger Balance: <span>₹${data.balance}.00</span></h2>
      </div>
      <button class="button" id="exit">E. exit</button>`;
    balance.innerHTML = "";
    balance.insertAdjacentHTML("beforeend", html);
  }

  function addOptionsHandler(e) {
    if (!e.target.classList.contains("option")) return;
    if (e.target.id === "withdraw") toggleClasses(firstOptions, withdraw);
    if (e.target.id === "transferCash") toggleClasses(firstOptions, transfer);
    if (e.target.id === "changePin") toggleClasses(firstOptions, changePin);
    if (e.target.id === "checkBalance") {
      toggleClasses(firstOptions, balance);
      checkUserBalance();
    }
  }

  function withdrawHandler(e) {
    e.target.id === "savings" ? (choosen = "savings") : (choosen = "current");
    toggleClasses(e.target.parentElement, e.target.parentElement.nextElementSibling);
  }

  function errorHandler(message) {
    error.classList.remove("hidden");
    error.innerHTML && (error.innerHTML = "");
    error.innerHTML = message;
    setTimeout(() => error.classList.add("hidden"), TIME * 1000);
    return;
  }

  function reload(time = TIME) {
    return setTimeout(() => location.reload(), time * 1000);
  }

  function toggleClasses(itemOne, itemTwo) {
    itemOne.classList.add("hidden");
    itemTwo.classList.remove("hidden");
  }
})();
