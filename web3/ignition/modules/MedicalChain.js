// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const NAME = "Admin";
const EMAIL = "admin@okmail.com";
const CONTACT = "1234567890";

module.exports = buildModule("MedicalChainModule", (m) => {

  const medicalchain = m.contract(
    "MedicalChain",
    [ADDRESS, NAME, EMAIL, CONTACT]
  );

  return { medicalchain };
});
