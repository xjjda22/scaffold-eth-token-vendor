import React, { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Switch, Route, Link } from "react-router-dom";
import "antd/dist/antd.css";
import { JsonRpcProvider, Web3Provider } from "@ethersproject/providers";

import "./App.css";

import { Row, Col, Card, Button, Menu, Alert, List, Input, Divider, Layout, Space, Progress, Steps } from "antd";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { useUserAddress } from "eth-hooks";
import {
  useExchangePrice,
  useGasPrice,
  useUserProvider,
  useContractLoader,
  useContractReader,
  useEventListener,
  useBalance,
  useExternalContractLoader,
} from "./hooks";
import {
  HeaderSt,
  Account,
  Faucet,
  Ramp,
  Contract,
  GasGauge,
  Balance,
  Address,
  EtherInput,
  AddressInput,
} from "./components";
import { Transactor } from "./helpers";
import { formatEther, parseEther } from "@ethersproject/units";
import { Hints, ExampleUI, Subgraph } from "./views";
import { INFURA_ID, DAI_ADDRESS, DAI_ABI, NETWORK, NETWORKS } from "./constants";

const humanizeDuration = require("humanize-duration");
const { Header, Footer, Sider, Content } = Layout;
const { Step } = Steps;

/*
    Welcome to 🏗 scaffold-eth !

    Code:
    https://github.com/austintgriffith/scaffold-eth

    Support:
    https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA
    or DM @austingriffith on twitter or telegram

    You should get your own Infura.io ID and put it in `constants.js`
    (this is your connection to the main Ethereum network for ENS etc.)


    📡 EXTERNAL CONTRACTS:
    You can also bring in contract artifacts in `constants.js`
    (and then use the `useExternalContractLoader()` hook!)
*/

/// 📡 What chain are your contracts deployed to?
const targetNetwork = NETWORKS["localhost"]; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

// 😬 Sorry for all the console logging
const DEBUG = true;
const showBroswerRouter = true;

// 🛰 providers
if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");
// const mainnetProvider = getDefaultProvider("mainnet", { infura: INFURA_ID, etherscan: ETHERSCAN_KEY, quorum: 1 });
// const mainnetProvider = new InfuraProvider("mainnet",INFURA_ID);
const mainnetProvider = new JsonRpcProvider("https://mainnet.infura.io/v3/" + INFURA_ID);
// ( ⚠️ Getting "failed to meet quorum" errors? Check your INFURA_ID)

// 🏠 Your local provider is usually pointed at your local blockchain
const localProviderUrl = targetNetwork.rpcUrl;
// as you deploy to other networks you can set REACT_APP_PROVIDER=https://dai.poa.network in packages/react-app/.env
const localProviderUrlFromEnv = process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : localProviderUrl;
if (DEBUG) console.log("🏠 Connecting to provider:", localProviderUrlFromEnv);
const localProvider = new JsonRpcProvider(localProviderUrlFromEnv);

// 🔭 block explorer URL
const blockExplorer = targetNetwork.blockExplorer;

let metamaskConnected = false;

const addressAustin = "austingriffith.eth";
const addressHarry = "0x73f058812ee1FaA73e429e9fE7FCa23Ec6859096";

function App(props) {
  const [injectedProvider, setInjectedProvider] = useState();
  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangePrice(targetNetwork, mainnetProvider, process.env.REACT_APP_POLLING);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "fast", process.env.REACT_APP_POLLING);
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProvider = useUserProvider(injectedProvider, localProvider);
  const address = useUserAddress(userProvider);
  if (DEBUG) console.log("👩‍💼 selected address:", address);

  // You can warn the user if you would like them to be on a specific network
  let localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  if (DEBUG) console.log("🏠 localChainId", localChainId);

  let selectedChainId = userProvider && userProvider._network && userProvider._network.chainId;
  if (DEBUG) console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userProvider, gasPrice);

  // Faucet Tx can be used to send funds from the faucet
  const faucetTx = Transactor(localProvider, gasPrice);

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(localProvider, address, process.env.REACT_APP_POLLING);
  if (DEBUG) console.log("💵 yourLocalBalance", yourLocalBalance ? formatEther(yourLocalBalance) : "...");

  // Just plug in different 🛰 providers to get your balance on different chains:
  // const yourMainnetBalance = useBalance(mainnetProvider, address, process.env.REACT_APP_POLLING);
  // if (DEBUG) console.log("💵 yourMainnetBalance", yourMainnetBalance ? formatEther(yourMainnetBalance) : "...");

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider);
  if (DEBUG) console.log("📝 readContracts", readContracts);

  // If you want to make 🔐 write transactions to your contracts, use the userProvider:
  const writeContracts = useContractLoader(userProvider);
  if (DEBUG) console.log("🔐 writeContracts", writeContracts);

  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  //const mainnetDAIContract = useExternalContractLoader(mainnetProvider, DAI_ADDRESS, DAI_ABI)
  //console.log("🥇DAI contract on mainnet:",mainnetDAIContract)
  //
  // Then read your DAI balance like:
  //const myMainnetBalance = useContractReader({DAI: mainnetDAIContract},"DAI", "balanceOf",["0x34aA3F359A9D614239015126635CE7732c18fDF3"])
  //

  const vendorAddress = readContracts && readContracts.Vendor.address;

  const vendorETHBalance = useBalance(localProvider, vendorAddress);
  if (DEBUG)
    console.log(
      "💵 vendorETHBalance",
      vendorETHBalance ? formatEther(vendorETHBalance) : "...",
      process.env.REACT_APP_POLLING,
    );

  const vendorTokenBalance = useContractReader(
    readContracts,
    "YourToken",
    "balanceOf",
    [vendorAddress],
    process.env.REACT_APP_POLLING,
  );
  console.log("🏵 vendorTokenBalance:", vendorTokenBalance ? formatEther(vendorTokenBalance) : "...");

  const yourTokenBalance = useContractReader(
    readContracts,
    "YourToken",
    "balanceOf",
    [address],
    process.env.REACT_APP_POLLING,
  );
  console.log("🏵 yourTokenBalance:", yourTokenBalance ? formatEther(yourTokenBalance) : "...");

  const tokensPerEth = useContractReader(readContracts, "Vendor", "tokensPerEth", "", process.env.REACT_APP_POLLING);
  console.log("🏦 tokensPerEth:", tokensPerEth ? tokensPerEth.toString() : "...");

  const tokensSupply = useContractReader(readContracts, "YourToken", "totalSupply", "", process.env.REACT_APP_POLLING);
  console.log("🏦 tokensSupply:", tokensSupply ? tokensSupply.toString() : "...");

  /*
  const addressFromENS = useResolveName(mainnetProvider, "austingriffith.eth");
  console.log("🏷 Resolved austingriffith.eth as:",addressFromENS)
  */

  let networkDisplay = "";
  if (localChainId && selectedChainId && localChainId != selectedChainId) {
    networkDisplay = (
      <div style={{ padding: 5 }}>
        <Alert
          message={"⚠️ Wrong Network"}
          description={
            <div>
              You have <b>{NETWORK(selectedChainId).name}</b> selected and you need to be on{" "}
              <b>{NETWORK(localChainId).name}</b>.
            </div>
          }
          type="error"
          closable={false}
        />
      </div>
    );
  } else {
    networkDisplay = <div style={{ padding: 5, color: targetNetwork.color }}>{targetNetwork.name}</div>;
  }

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new Web3Provider(provider));
    metamaskConnected = true;
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  const [route, setRoute] = useState();
  useEffect(() => {
    setRoute(window.location.pathname);
  }, [setRoute]);

  // let faucetHint = ""
  // const [ faucetClicked, setFaucetClicked ] = useState( false );
  //   if(!faucetClicked&&localProvider&&localProvider._network&&localProvider._network.chainId==31337&&yourLocalBalance&&formatEther(yourLocalBalance)<=0){
  //   faucetHint = (
  //     <div style={{padding:16}}>
  //       <Button type={"primary"} onClick={()=>{
  //         faucetTx({
  //           to: address,
  //           value: parseEther("1"),
  //         });
  //         setFaucetClicked(true)
  //       }}>
  //         💰 Grab funds from the faucet ⛽️
  //       </Button>
  //     </div>
  //   )
  // }

  const buyTokensEvents = useEventListener(readContracts, "Vendor", "BuyTokens", localProvider, 1);
  console.log("📟 buyTokensEvents:", buyTokensEvents);

  const sellTokensEvents = useEventListener(readContracts, "Vendor", "SellTokens", localProvider, 1);
  console.log("📟 sellTokensEvents:", sellTokensEvents);

  const [tokenBuyAmount, setTokenBuyAmount] = useState();

  const ethCostToPurchaseTokens =
    tokenBuyAmount && tokensPerEth && parseEther("" + tokenBuyAmount / parseFloat(tokensPerEth));
  console.log("ethCostToPurchaseTokens:", ethCostToPurchaseTokens);

  const [tokenSendToAddress, setTokenSendToAddress] = useState();
  const [tokenSendAmount, setTokenSendAmount] = useState();

  const [buying, setBuying] = useState();

  let transferDisplay = "";
  if (yourTokenBalance) {
    transferDisplay = (
      <div style={{ padding: 5, marginTop: 10, width: "100%", margin: "auto" }}>
        <Card title="Transfer tokens" style={{borderRadius: 12,}}>
          <div>
            <div style={{ padding: 2 }}>
              <AddressInput
                ensProvider={mainnetProvider}
                placeholder="to address"
                value={tokenSendToAddress}
                onChange={setTokenSendToAddress}
              />
            </div>
            <div style={{ padding: 2 }}>
              <Input
                style={{ textAlign: "center" }}
                placeholder={"amount of tokens to send"}
                value={tokenSendAmount}
                onChange={e => {
                  setTokenSendAmount(e.target.value);
                }}
              />
            </div>
          </div>
          <div style={{ padding: 8 }}>
            <Button
              type={"primary"}
              onClick={() => {
                tx(writeContracts.YourToken.transfer(tokenSendToAddress, parseEther("" + tokenSendAmount)));
              }}
            >
              Send Tokens
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="App">
      {/* ✏️ Edit the header and change the title to your project name */}

      <Layout>
        <Header
          style={{ padding: 5, position: "fixed", zIndex: 1, width: "100%", height: "auto", top: 0 }}
          className="grad_glasswater"
        >
          <HeaderSt />
          <Space>
            <Account
              address={address}
              localProvider={localProvider}
              userProvider={userProvider}
              mainnetProvider={mainnetProvider}
              // price={price}
              web3Modal={web3Modal}
              loadWeb3Modal={loadWeb3Modal}
              logoutOfWeb3Modal={logoutOfWeb3Modal}
              blockExplorer={blockExplorer}
            />
            {networkDisplay}
            {/*faucetHint*/}
          </Space>
        </Header>
        <Content style={{ paddingTop: 150, paddingBottom: 170, width: "100%" }} className="">
          <BrowserRouter>
            {showBroswerRouter && (
              <Menu style={{ textAlign: "center" }} selectedKeys={[route]} mode="horizontal">
                <Menu.Item key="/">
                  <Link
                    onClick={() => {
                      setRoute("/");
                    }}
                    to="/"
                  >
                    YourToken
                  </Link>
                </Menu.Item>
                <Menu.Item key="/contracts">
                  <Link
                    onClick={() => {
                      setRoute("/contracts");
                    }}
                    to="/contracts"
                  >
                    Debug Contracts
                  </Link>
                </Menu.Item>
              </Menu>
            )}
            <Switch>
              <Route exact path="/">
                <div style={{ padding: 5, marginTop: 10, width: "100%", margin: "auto" }}>
                  <Space>
                    <Card title="💰 Your Tokens" style={{backgroundColor:'#bfac00', borderRadius: 12,}}>
                      <div style={{ padding: 2 }}>
                        <Progress
                          type="circle"
                          percent={Math.round((yourTokenBalance * 100) / tokensSupply)}
                          strokeColor="#ffeb3b"
                        />
                        <Balance balance={yourTokenBalance} fontSize={64} />
                      </div>
                    </Card>

                    <Card title="💰 Vendor Token Balance" style={{backgroundColor:'#1171ca', borderRadius: 12,}} >
                      <div style={{ padding: 2 }}>
                        <Progress
                          type="circle"
                          percent={Math.round((vendorTokenBalance * 100) / tokensSupply)}
                          // strokeColor="#66ca39"
                          // strokeColor={{
                          //   0: '#108ee9',
                          //   100: '#87d068',
                          // }}
                        />
                        <Balance balance={vendorTokenBalance} fontSize={64} />
                      </div>
                    </Card>

                    <Card title=" ♦ Vendor ETH Balance" style={{backgroundColor:'#35900c', borderRadius: 12,}} >
                      <div style={{ padding: 2 }}>
                        <Progress
                          type="circle"
                          percent={Math.round((vendorETHBalance * 10000) / tokensSupply)}
                          strokeColor="#66ca39"
                        />
                        <Balance balance={vendorETHBalance} fontSize={64} />
                      </div>
                    </Card>
                  </Space>
                </div>

                <Divider />
                <div style={{ padding: 5, marginTop: 10, width: "100%", margin: "auto" }}>
                  <Card title=" 🛠️ Buy ↔️ Sell Tokens " style={{borderRadius: 12,}}>
                    <Steps current={2} progressDot={true}>
                      <Step title="step 1" description="buy some tokens" />
                      <Step title="step 2" description="approve tokens" />
                      <Step title="step 3" description="sell back tokens" />
                    </Steps>
                    <div style={{ padding: 2 }}>{tokensPerEth && tokensPerEth.toNumber()} tokens per ETH</div>

                    <div style={{ padding: 2 }}>
                      <Balance balance={ethCostToPurchaseTokens} />
                      <Balance balance={ethCostToPurchaseTokens} dollarMultiplier={price} />
                    </div>
                    <Input
                      style={{ textAlign: "center" }}
                      placeholder={"amount of tokens to buy ↔️ approve ↔️ sell"}
                      value={tokenBuyAmount}
                      onChange={e => {
                        setTokenBuyAmount(e.target.value);
                      }}
                    />
                    <div style={{ padding: 10 }}>
                      <Space>
                        <Button
                          type={"primary"}
                          loading={buying}
                          onClick={async () => {
                            setBuying(true);
                            await tx(writeContracts.Vendor.buyTokens({ value: ethCostToPurchaseTokens }));
                            setBuying(false);
                          }}

                          style={{backgroundColor:'#bfac00'}}
                        >
                          ♦ Buy Tokens
                        </Button>
                        <Button
                          type={"primary"}
                          loading={buying}
                          onClick={async () => {
                            setBuying(true);
                            await tx(
                              writeContracts.YourToken.approve(
                                readContracts.Vendor.address,
                                parseEther("" + tokenBuyAmount),
                              ),
                            );
                            setBuying(false);
                          }}
                        >
                          👍 Approve Tokens
                        </Button>
                        <Button
                          type={"primary"}
                          loading={buying}
                          onClick={async () => {
                            setBuying(true);
                            await tx(writeContracts.Vendor.sellTokens(parseEther("" + tokenBuyAmount)));
                            setBuying(false);
                          }}

                          style={{backgroundColor:'#35900c'}}
                        >
                          💰 Sell Tokens
                        </Button>
                      </Space>
                    </div>
                  </Card>
                </div>

                {transferDisplay}
                <div
                  style={{
                    width: 600,
                    margin: "auto",
                    marginTop: 10,
                    paddingTop: 10,
                    fontWeight: "bolder",
                    borderRadius: 12,
                  }}
                  class="grad_deeprelief"
                >
                  <div>Buy Token Events:</div>
                  <List
                    dataSource={buyTokensEvents}
                    renderItem={item => {
                      return (
                        <List.Item key={item[0] + item[1] + item.blockNumber}>
                          <Address value={item[0]} ensProvider={mainnetProvider} fontSize={16} /> paid
                          <Balance balance={item[1]} />
                          ETH to get
                          <Balance balance={item[2]} />
                          Tokens
                        </List.Item>
                      );
                    }}
                  />
                </div>

                <div
                  style={{
                    width: 600,
                    margin: "auto",
                    marginTop: 10,
                    paddingTop: 10,
                    fontWeight: "bolder",
                    borderRadius: 12,
                  }}
                  class="grad_deeprelief"
                >
                  <div>Sell Token Events:</div>
                  <List
                    dataSource={sellTokensEvents}
                    renderItem={item => {
                      return (
                        <List.Item key={item[0] + item[1] + item.blockNumber}>
                          <Address value={item[0]} ensProvider={mainnetProvider} fontSize={16} /> paid
                          <Balance balance={item[1]} />
                          Tokens to get
                          <Balance balance={item[2]} />
                          Eth
                        </List.Item>
                      );
                    }}
                  />
                </div>

                {/*

                🎛 this scaffolding is full of commonly used components
                this <Contract/> component will automatically parse your ABI
                and give you a form to interact with it locally
                
                */}

                {/* Uncomment to display and interact with an external contract (DAI on mainnet):
                  <Contract
                    name="DAI"
                    customContract={mainnetDAIContract}
                    signer={userProvider.getSigner()}
                    provider={mainnetProvider}
                    address={address}
                    blockExplorer={blockExplorer}
                  />
                */}
              </Route>
              <Route path="/contracts">
                {showBroswerRouter && (
                  <Contract
                    name="Vendor"
                    signer={userProvider.getSigner()}
                    provider={localProvider}
                    address={address}
                    blockExplorer={blockExplorer}
                  />
                )}
                {showBroswerRouter && (
                  <Contract
                    name="YourToken"
                    signer={userProvider.getSigner()}
                    provider={localProvider}
                    address={address}
                    blockExplorer={blockExplorer}
                  />
                )}
              </Route>
            </Switch>
          </BrowserRouter>
        </Content>
        <Footer style={{ padding: 5, position: "fixed", zIndex: 1, width: "100%", bottom: 0 }} className="grad_glasswater">
          <Row align="middle" gutter={[4, 4]}>
            <Col span={6}>
              <Ramp price={price} address={address} networks={NETWORKS} />
            </Col>

            <Col span={6} style={{ textAlign: "center", opacity: 0.8 }}>
              <GasGauge gasPrice={gasPrice} />
            </Col>
            {/*}
           <Col span={8} style={{ textAlign: "center", opacity: 1 }}>
             <Button
               onClick={() => {
                 window.open("https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA");
               }}
               size="large"
               shape="round"
             >
               <span style={{ marginRight: 8 }} role="img" aria-label="support">
                 💬
               </span>
               Support
             </Button>
           </Col>*/}
            <Col span={12}>
              {
                /*  if the local provider has a signer, let's show the faucet:  */
                localProvider &&
                localProvider.connection &&
                localProvider.connection.url &&
                localProvider.connection.url.indexOf(window.location.hostname) >= 0 &&
                !process.env.REACT_APP_PROVIDER &&
                price > 1 ? (
                  <Faucet localProvider={localProvider} price={price} ensProvider={mainnetProvider} />
                ) : (
                  ""
                )
              }
            </Col>
          </Row>
          <Row align="middle" gutter={[4, 4]}>
            <Col span={12}>
              <div style={{ opacity: 0.5 }}>
                Created by 👨‍💼 &nbsp;
                <Address value={addressAustin} ensProvider={mainnetProvider} fontSize={16} />
                <br />
                developed by 👨‍💼 &nbsp;
                <Address value={addressHarry} ensProvider={mainnetProvider} fontSize={16} />
              </div>
            </Col>

            <Col span={12} style={{ textAlign: "center", opacity: 0.8 }}>
              <div style={{ opacity: 0.5 }}>
                <a
                  target="_blank"
                  style={{ padding: 32, color: "#000" }}
                  href="https://github.com/austintgriffith/scaffold-eth"
                >
                  🍴 Fork me!
                </a>
                <br />
                <a
                  target="_blank"
                  style={{ padding: 10, color: "#000" }}
                  href="https://github.com/harryranakl/scaffold-eth-token-vendor"
                >
                  🍴 token-vendor-eth Fork me!
                </a>
              </div>
            </Col>
          </Row>
        </Footer>
      </Layout>
    </div>
  );
}

/*
  Web3 modal helps us "connect" external wallets:
*/
const web3Modal = new Web3Modal({
  // network: "mainnet", // optional
  cacheProvider: true, // optional
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        infuraId: INFURA_ID,
      },
    },
  },
});

const logoutOfWeb3Modal = async () => {
  await web3Modal.clearCachedProvider();
  metamaskConnected = false;
  setTimeout(() => {
    window.location.reload();
  }, 1);
};

window.ethereum &&
  window.ethereum.on("chainChanged", chainId => {
    setTimeout(() => {
      window.location.reload();
    }, 1);
  });

export default App;
