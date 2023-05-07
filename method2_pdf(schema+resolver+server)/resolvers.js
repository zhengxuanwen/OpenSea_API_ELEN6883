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


module.exports = resolvers;
