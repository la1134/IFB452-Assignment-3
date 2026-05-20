const { time } = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
  console.log("Current block time:", await time.latest());
  
  // Fast forward 31 days (in seconds)
  await time.increase(31 * 24 * 60 * 60);
  await network.provider.send("evm_mine");
  
  console.log("New block time:", await time.latest());
  console.log(" Blockchain successfully time-traveled 31 days! Refresh your React app.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});