const Web3 = require('web3');
const ERC721_ABI = require('./ERC721-ABI.json');

const web3 = new Web3('https://mainnet.infura.io/v3/7ab2bc4807cc4c9ea1cd9b11e59c6f1a');

const resolvers = {
  Query: {
    assetById: async (_, { contractAddress, tokenId }) => {
      const contractInstance = new web3.eth.Contract(ERC721_ABI, contractAddress);
      const tokenURI = await contractInstance.methods.tokenURI(tokenId).call();
      const owner = await contractInstance.methods.ownerOf(tokenId).call();
      const name = await contractInstance.methods.name().call();
      const symbol = await contractInstance.methods.symbol().call();

      return {
        tokenId: tokenId,
        tokenURI: tokenURI,
        owner: owner,
        contractAddress: contractAddress,
        name: name,
        symbol: symbol,
      };
    },
  },
  Asset: {
    owner: async (asset) => {
      const contractInstance = new web3.eth.Contract(ERC721_ABI, asset.contractAddress);
      const owner = await contractInstance.methods.ownerOf(asset.tokenId).call();
      return owner;
    },
    creator: async (asset) => {
      const contractInstance = new web3.eth.Contract(ERC721_ABI, asset.contractAddress);
      const creator = await findCreator(contractInstance, asset.tokenId);
      return creator;
    },
    transactions: async (asset) => {
      const transactions = await fetchTransferEvents(asset.contractAddress, asset.tokenId);
      return transactions;
    }
  },
};

async function findCreator(contractInstance, tokenId) {
  const eventName = 'Transfer';
  const transferEvents = await contractInstance.getPastEvents(eventName, {
    filter: { tokenId: tokenId },
    fromBlock: 0,
    toBlock: 'latest',
  });

  const creationEvent = transferEvents.find(
    (event) => event.returnValues.from === '0x0000000000000000000000000000000000000000'
  );

  return creationEvent ? creationEvent.returnValues.to : null;
}

async function fetchTransferEvents(contractAddress, tokenId) {
  try {
    const contract = new web3.eth.Contract(ERC721_ABI, contractAddress);
    const transferEvents = await contract.getPastEvents('Transfer', {
      filter: { tokenId: tokenId },
      fromBlock: 0,
      toBlock: 'latest',
    });

    return transferEvents.map((event) => ({
      id: event.id,
      from: event.returnValues.from,
      to: event.returnValues.to,
      transactionHash: event.transactionHash,
    }));
  } catch (error) {
    console.error('Error fetching transfer events:', error);
    return [];
  }
}

module.exports = resolvers;
