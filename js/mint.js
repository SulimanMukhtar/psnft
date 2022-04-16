let minting = false;

function minus() {
  let num = document.getElementById("pricex").textContent.toString();
  if (parseInt(num) > 1) {
    document.getElementById("pricex").innerHTML = parseInt(num) - 1;
    document.getElementById("price").innerHTML = ((parseInt(num) - 1) * 0.05).toFixed(1);
  }
}

function plus() {
  let num = document.getElementById("pricex").textContent.toString();
  if (parseInt(num) < 5) {
    document.getElementById("pricex").innerHTML = parseInt(num) + 1;
    document.getElementById("price").innerHTML = ((parseInt(num) + 1) * 0.05).toFixed(1);
  }
}

function set_max() {
  document.getElementById("pricex").innerHTML = 5;
  document.getElementById("price").innerHTML = 5 * 0.05;
}

function getMobileOperatingSystem() {
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;

  if (userAgent.match(/iPad/i) || userAgent.match(/iPhone/i) || userAgent.match(/iPod/i)) {
    return 'iOS';

  }
  else if (userAgent.match(/Android/i)) {

    return 'Android';
  }
  else {
    return 'unknown';
  }
}

const connectWallet = async () => {
  try {
    if (!ethereum) return alert("Please install Metamask");
    // Request Metamask for accounts
    await ethereum.request({ method: "eth_requestAccounts" });
  } catch (error) {
    alert(error.data.message);
    throw new Error("No Ethereum Object");
  }
};

async function mint(evt) {
  var elem = document.getElementById('transfer');
  var txt = elem.textContent || elem.innerText;
  if (txt == "Connect Wallet") {
    // if (getMobileOperatingSystem() == "iOS" || getMobileOperatingSystem() == "Android" && !ethereum) {
    //   window.location.replace("https://metamask.app.link/dapp/mint.powershakers.club/");
    // }
    connectWallet();
    document.getElementById('transfer').innerText = "Mint";
  } else {
    try {
      if (minting) {
        alert("Transaction already pending...");
        return;
      }
      // Check For Wallet
      const walletConnected = await checkWalletConnected();
      if (!walletConnected) {
        return;
      }
      // Minting

      minting = true;

      const provider = getProvider();
      const signer = getSigner();
      const signerAddress = await getSignerAddress();
      const data = await contractData();

      const nftContract = new ethers.Contract(
        data.contractAddress,
        data.abi,
        provider
      );
      const nftContractWithSigner = nftContract.connect(signer);

      let mintValue = document.getElementById("pricex").textContent.toString();
      mintValue = parseInt(mintValue);

      if (mintValue < 1) {
        alert("Mint Amount should be at least 1");
        return;
      }

      // Check if Signer is Owner
      const owner = await nftContract.owner();
      // Get Cost
      // const cost = 0.04 * 10 ** 18;
      const cost = await nftContract.cost();

      const Single_Mint_Cost = cost.toString();
      const Total_Cost = Single_Mint_Cost * mintValue;

      try {
        if (owner === signerAddress) {
          let gasLimit = await nftContract.estimateGas.mint(
            signerAddress,
            mintValue,
            {
              value: Total_Cost.toString(),
            }
          );

          let tempTx = await nftContractWithSigner.populateTransaction.mint(
            signerAddress,
            mintValue,
            {
              value: parseInt(0).toString(),
            }
          );
          tempTx.value = tempTx.value.toHexString();

          const transactionParameters = {
            nonce: "0x00", // ignored by MetaMask
            gas: gasLimit.toHexString(), // customizable by user during MetaMask confirmation.
            ...tempTx,
          };

          await window.ethereum.request({
            method: "eth_sendTransaction",
            params: [transactionParameters],
          });
        } else {
          let gasLimit = await nftContract.estimateGas.mint(
            signerAddress,
            mintValue,
            {
              value: Total_Cost.toString(),
            }
          );
          let tempTx = await nftContractWithSigner.populateTransaction.mint(
            signerAddress,
            mintValue,
            {
              value: Total_Cost.toString(),
            }
          );
          tempTx.value = tempTx.value.toHexString();

          const transactionParameters = {
            nonce: "0x00", // ignored by MetaMask
            gas: gasLimit.toHexString(), // customizable by user during MetaMask confirmation.
            ...tempTx,
          };

          await window.ethereum.request({
            method: "eth_sendTransaction",
            params: [transactionParameters],
          });
        }

        // await txx.wait();
        window.location.reload();
      } catch (error) {
        minting = false;
        console.log(error);
      }
    } catch (error) {
      minting = false;
      console.log(error);
    }
  }
}

async function checkWalletConnected() {
  if (window.ethereum) {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    if (accounts.length !== 0) {
      return true;
    }
  } else {
    alert("Please install Metamask!");
    return false;
  }
}

const getProvider = () => {
  return new ethers.providers.Web3Provider(window.ethereum);
};

const getSigner = () => {
  const provider = getProvider();
  return provider.getSigner();
};

// returns promise
const getSignerAddress = () => {
  const provider = getProvider();
  return provider.getSigner().getAddress();
};

const contractData = async () => {
  let res = await fetch("js/blockchain.json");
  res = await res.json();
  return res;
};
