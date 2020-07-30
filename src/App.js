import React, { Component } from "react";
import ipfsHash from "./contracts/ipfsHash.json";
import Portis from '@portis/web3';
import Web3 from 'web3';
import "./App.css";
import { Container, Form, Button, Table } from 'react-bootstrap';

const IPFS = require('ipfs-api');
const ipfs = new IPFS({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https'
});



class App extends Component {
  constructor() {
    super()
    this.state = {
      web3: {},
      contractAddress: "",
      ipfsHash:null,
      buffer:'',
      ethAddress:'',
      blockNumber:'',
      transactionHash:'',
      gasUsed:'',
      txReceipt: '',
      ipfsUrl: ""
    }
  }

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const customNode = {
        nodeUrl: 'https://rpc-mumbai.matic.today/',
        chainId: 80001,
      };
      
      const portis = new Portis('0fc96d71-292b-4530-9fe5-404b55a166da', customNode);
      this.web3 = new Web3(portis.provider);

      // Use web3 to get the user's accounts.
      this.accounts = await this.web3.eth.getAccounts();
      console.log("Accounts : " + this.accounts);

      // Get the contract instance.
      this.networkId = await this.web3.eth.net.getId();
      console.log("Matic network ID: " + this.networkId);
      
      this.ipfsContract = new this.web3.eth.Contract(
        ipfsHash.abi,
        ipfsHash.networks[this.networkId] && ipfsHash.networks[this.networkId].address,
      );
      console.log("Contract Instance : " + this.ipfsContract);

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({
        web3: this.web3,
        contractAddress: ipfsHash.networks[this.networkId].address
      });
      console.log("Web3 Obj : " + this.state.web3);
      portis.isLoggedIn().then(({ error, result }) => {
        console.log(error, result);
      });
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  captureFile = (event) => {
    event.stopPropagation()
    event.preventDefault()
    const file = event.target.files[0]
    let reader = new window.FileReader()
    reader.readAsArrayBuffer(file)
    reader.onloadend = () => this.convertToBuffer(reader)
  };

  convertToBuffer = async (reader) => {
    const buffer = await Buffer.from(reader.result);
    this.setState({ buffer });
  };

  onClick = async () => {
    console.log(this.state.transactionHash);
    alert('Getting your Transaction Receipt');
    try {
      this.setState({ blockNumber: "waiting....", gasUsed: "waiting..." });

      await this.web3.eth
        .getTransactionReceipt(this.state.transactionHash, (error, txReceipt) => {
        this.setState({txReceipt})
        console.log(error, txReceipt);
        })

    } catch (error) {
      console.log("onCLick error: " + JSON.stringify(error));
    }
  }

  onSubmit = async (event) => {
    alert('Sending your file to get stored on IPFS');
    event.preventDefault();
    console.log("sending from Account: " + this.accounts[0]);
    try {
      await ipfs.add(this.state.buffer, (err, ipfsHash) => {
        console.log(err,ipfsHash);
        //setState by setting ipfsHash to ipfsHash[0].hash 
        this.setState({ ipfsHash: ipfsHash[0].hash });
        console.log(this.state.ipfsHash)
        this.ipfsContract.methods
          .sendHash(this.state.ipfsHash)
          .send(
            { from: this.accounts[0] },
            (error, txnHash) => {
              console.log(error);
              console.log(txnHash);
              this.setState({
                transactionHash: txnHash,
                ipfsUrl: `https://gateway.ipfs.io/ipfs/${this.state.ipfsHash}`
              })
            })
      })
    } catch (error) {
      console.log(error);
    }

  }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <header className="App-header">
          <h1> Ethereum and IPFS with Create React App</h1>
        </header>
        
        <hr />
        <Container>
          <h3> Choose file to send to IPFS </h3>
          <Form onSubmit={this.onSubmit}>
            <input
              type="file"
              onChange={this.captureFile}
            />
            <Button
              bsStyle="primary"
              type="submit">
              Send it
           </Button>
          </Form>
          <hr />
          <Button onClick={this.onClick}> Get Transaction Receipt </Button>
          <Table bordered responsive>
            <thead>
              <tr>
                <th>Tx Receipt Category</th>
                <th>Values</th>
              </tr>
            </thead>
             
            <tbody>
              <tr>
                <td>IPFS Hash # stored on Eth Contract</td>
                <td>{this.state.ipfsHash}</td>
                <td>
                  <a href={this.state.ipfsUrl} target="_blank" rel="noopener noreferrer">
                    Open file on IPFS
                  </a>
                </td>
              </tr>
              <tr>
                <td>Ethereum Contract Address</td>
                <td>{this.state.contractAddress}</td>
              </tr>
              <tr>
                <td>Tx Hash # </td>
                <td>{this.state.transactionHash}</td>
              </tr>
              <tr>
                <td>Block Number # </td>
                <td>{this.state.txReceipt.blockNumber}</td>
              </tr>
              <tr>
                <td>Gas Used</td>
                <td>{this.state.txReceipt.gasUsed}</td>
              </tr>
              
            </tbody>
          </Table>
        </Container>
      </div>
    );
  }
}

export default App;
