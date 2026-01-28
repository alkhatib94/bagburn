# BAG Burn - NFT Burning Platform on Base

A smart contract and web interface for burning NFTs in exchange for USDC on Base network.

## Features

- Burn NFTs from two supported contracts:
  - BAG Cornucopias (Cardano): 10.4 USDC per NFT
  - BAG Cornucopias (BASE): 8 USDC per NFT
- Web interface with wallet connection (MetaMask, WalletConnect)
- Batch burning support
- Real-time USDC balance display
- Secure smart contract with ReentrancyGuard

## Project Structure

```
.
├── contracts/          # Smart contracts
│   ├── BAGBurn.sol    # Main burn contract
│   ├── MockERC721.sol # Mock NFT for testing
│   └── MockERC20.sol  # Mock USDC for testing
├── test/              # Contract tests
├── scripts/           # Deployment scripts
└── frontend/          # Next.js web interface
    └── src/
        ├── components/  # React components
        ├── hooks/       # Custom hooks
        └── config/      # Contract configs
```

## Setup

### Smart Contract

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Add your private key and RPC URLs to `.env`

4. Compile contracts:
```bash
npm run compile
```

5. Run tests:
```bash
npm run test
```

6. Deploy to Base:
```bash
npm run deploy:base
```

### Frontend

1. Navigate to frontend directory:
```bash
cd frontend
npm install
```

2. Create `.env.local` file:
```bash
cp .env.example .env.local
```

3. Add your WalletConnect Project ID and deployed contract address:
```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_BAG_BURN_ADDRESS=deployed_contract_address
```

4. Run development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
npm start
```

## Important Notes

- **Fund the contract**: After deployment, you must fund the BAGBurn contract with USDC before users can burn NFTs
- **Network**: Make sure you're connected to Base Mainnet (Chain ID: 8453)
- **USDC Address**: Default USDC address on Base is `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

## Contract Addresses

- BAG Cornucopias (Cardano): `0x6aa70c267e7de716116a518bf5203a7ef5fc5c68`
- BAG Cornucopias (BASE): `0x2d22e247ee09fa27ffee2421a56fe92d9a2a296c`
- USDC on Base: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

## Security

- ReentrancyGuard protection
- Ownership verification before burning
- Supported contract validation
- Safe USDC transfers

## License

MIT
